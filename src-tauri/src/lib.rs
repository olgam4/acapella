use avfaudio::session::{AVAudioSession, Category};

use cast_sender::namespace::media::{
    MediaInformationBuilder, MusicTrackMediaMetadataBuilder, StreamType,
};
use cast_sender::{AppId, Error as CastError, ImageBuilder, MediaController, Receiver};
use futures_util::{pin_mut, stream::StreamExt};
use mdns::{Error, Record, RecordKind};
use once_cell::sync::Lazy;
use std::error::Error as StdError;
use std::sync::{Arc, Mutex};
use std::{net::IpAddr, time::Duration};
use stream_download::source::DecodeError;
use stream_download::storage::temp::TempStorageProvider;
use stream_download::{Settings, StreamDownload};
use tauri_plugin_sql::{Migration, MigrationKind};

const SERVICE_NAME: &'static str = "_googlecast._tcp.local";

static MEDIA_CONTROLLER: Lazy<Mutex<Option<MediaController>>> = Lazy::new(|| Mutex::new(None));
static SINK: Lazy<Mutex<Option<Arc<rodio::Sink>>>> = Lazy::new(|| Mutex::new(None));

struct NamedCastDevice {
    name: String,
    addr: IpAddr,
}

async fn discover() -> Result<Vec<NamedCastDevice>, Error> {
    log::info!("discovering devices around");
    let stream = mdns::discover::all(SERVICE_NAME, Duration::from_millis(7000))?.listen();
    pin_mut!(stream);

    let mut addresses = vec![];
    let mut names = vec![];
    while let Some(Ok(response)) = stream.next().await {
        let addr = response.records().filter_map(self::to_ip_addr).next();

        if let Some(addr) = addr {
            log::info!("found cast device at {:?}", addr);
            addresses.push(addr);
        } else {
            log::info!("cast device does not advertise address");
        }

        if addresses.len() >= 2 {
            break;
        }
    }

    while let Some(Ok(response)) = stream.next().await {
        let name = response.records().filter_map(self::to_text).next();

        if let Some(name) = name {
            log::info!("found cast device named {:?}", name);
            names.push(name);
        } else {
            log::info!("cast device does not advertise name");
        }

        if names.len() >= 2 {
            break;
        }
    }

    let named = addresses
        .iter()
        .map(|addr| {
            let name = names.iter().find(|n| n.id == addr.id);
            NamedCastDevice {
                name: name
                    .unwrap_or(&CastName {
                        id: "".to_string(),
                        name: "".to_string(),
                    })
                    .name
                    .clone(),
                addr: addr.ip_addr,
            }
        })
        .collect();

    Ok(named)
}

#[derive(Debug)]
struct CastName {
    id: String,
    name: String,
}

fn to_text(record: &Record) -> Option<CastName> {
    match &record.kind {
        RecordKind::TXT(txt) => {
            let id = txt
                .iter()
                .find(|s| s.starts_with("id="))?
                .to_string()
                .replace("id=", "");
            let name = txt
                .iter()
                .find(|s| s.starts_with("fn="))?
                .to_string()
                .replace("fn=", "");
            Some(CastName { id, name })
        }
        _ => None,
    }
}

#[derive(Debug)]
struct CastDevice {
    id: String,
    ip_addr: IpAddr,
}

fn to_ip_addr(record: &Record) -> Option<CastDevice> {
    match record.kind {
        RecordKind::A(addr) => Some(CastDevice {
            id: record.name.clone().replace(".local", "").replace("-", ""),
            ip_addr: addr.into(),
        }),
        _ => None,
    }
}

async fn connect_to_cast(addr: IpAddr) -> Result<MediaController, CastError> {
    let receiver = Receiver::new();
    log::info!("trying to connect to receiver");
    receiver.connect(addr.to_string().as_str()).await?;
    log::info!("receiver connected");

    let app = receiver.launch_app(AppId::DefaultMediaReceiver).await?;
    log::info!("app launched");

    let media_controller = MediaController::new(app.clone(), receiver.clone())?;
    log::info!("media controller created");

    Ok(media_controller)
}

async fn send_audio(
    media_controller: MediaController,
    audio_source: String,
) -> Result<(), CastError> {
    let metadata = MusicTrackMediaMetadataBuilder::default()
        .title("Acapella")
        .images(vec![ImageBuilder::default()
            .url("https://media.istockphoto.com/id/1356265093/vector/birthday-party-emoji-celebrate-emoticon-happy-birthday-face-hat-emoji.jpg?s=612x612&w=0&k=20&c=cwQdbKQQaEPo1wF-TNMCOllGYY3k3pITTAt78MTWfK0=")
            .build()
            .unwrap()])
        .build()
        .unwrap();

    let media_info = MediaInformationBuilder::default()
        .content_id(audio_source)
        .stream_type(StreamType::Live)
        .content_type("audio/mpeg")
        .metadata(metadata)
        .build()
        .unwrap();

    media_controller.load(media_info).await?;
    Ok(())
}

#[tauri::command]
async fn discover_cast_devices() -> Result<Vec<(String, IpAddr)>, String> {
    let addresses = discover().await;

    match addresses {
        Ok(addresses) => Ok(addresses.iter().map(|a| (a.name.clone(), a.addr)).collect()),
        Err(_) => Err("Woups my man".to_string()),
    }
}

#[tauri::command]
async fn connect_to_cast_device(addr: &str) -> Result<(), &str> {
    log::info!("Connecting to cast device {addr}...");

    let ip = IpAddr::V4(addr.parse().unwrap());

    log::info!("Connecting to ip {:?}...", ip);
    let media_controller = connect_to_cast(ip).await;

    if media_controller.is_err() {
        log::info!("Connection failed: {}", media_controller.err().unwrap());
        return Err("Woups my man");
    }

    log::info!("Connected to ip {:?}", ip);
    let media_controller = media_controller.unwrap();

    MEDIA_CONTROLLER.lock().unwrap().replace(media_controller);

    log::info!("Saved media controller to cell");

    Ok(())
}

#[tauri::command]
async fn cast_audio(audio_source: String) -> Result<(), String> {
    let m = MEDIA_CONTROLLER.lock().unwrap().clone();
    let future = match m {
        Some(media_controller) => {
            log::info!("{} {:?} ", audio_source, media_controller);
            send_audio(media_controller, audio_source)
        }
        None => return Err("Woups my man".to_string()),
    };

    log::info!("Sending audio to cast device");

    let _ = future.await;

    Ok(())
}

fn set_media(artist: String, album: String, title: String, cover: String, duration: String) {
    unsafe {
        let shared_instance = AVAudioSession::shared_instance();
        shared_instance.activate();

        let default = objc2_media_player::MPNowPlayingInfoCenter::defaultCenter();
        objc2_media_player::MPNowPlayingInfoCenter::setNowPlayingInfo(&*default, {
            let keys = &[
                objc2_media_player::MPMediaItemPropertyArtist,
                objc2_media_player::MPMediaItemPropertyAlbumTitle,
                objc2_media_player::MPMediaItemPropertyTitle,
                objc2_media_player::MPMediaItemPropertyAssetURL,
                objc2_media_player::MPMediaItemPropertyPlaybackDuration,
            ];
            let owned_objects: &[objc2::rc::Retained<objc2::runtime::AnyObject>] = &[
                objc2::rc::Retained::into_super(objc2::rc::Retained::into_super(
                    objc2_foundation::NSString::from_str(&artist),
                )),
                objc2::rc::Retained::into_super(objc2::rc::Retained::into_super(
                    objc2_foundation::NSString::from_str(&album),
                )),
                objc2::rc::Retained::into_super(objc2::rc::Retained::into_super(
                    objc2_foundation::NSString::from_str(&title),
                )),
                objc2::rc::Retained::into_super(objc2::rc::Retained::into_super(
                    objc2_foundation::NSString::from_str(&cover),
                )),
                objc2::rc::Retained::into_super(objc2::rc::Retained::into_super(
                    objc2_foundation::NSString::from_str(&duration),
                )),
            ];
            Some(&objc2_foundation::NSDictionary::from_retained_objects(
                keys,
                owned_objects,
            ))
        });
    }
}

#[tauri::command]
async fn play_audio(
    audio_source: String,
    artist: String,
    album: String,
    title: String,
    cover: String,
    duration: String,
) -> Result<(), String> {
    log::info!("Playing audio");
    match SINK.lock().unwrap().as_ref() {
        Some(sink) => {
            sink.pause();
            sink.clear();
            sink.stop();
        }
        None => (),
    }

    set_media(artist, album, title, cover, duration);

    let reader = match StreamDownload::new_http(
        audio_source.parse().unwrap(),
        TempStorageProvider::new(),
        Settings::default(),
    )
    .await
    {
        Ok(reader) => reader,
        Err(e) => return Err(e.decode_error().await)?,
    };

    let handle = tokio::task::spawn_blocking(move || {
        let (_stream, handle) = rodio::OutputStream::try_default()?;
        let sink = rodio::Sink::try_new(&handle)?;
        sink.append(rodio::Decoder::new(reader)?);
        let sink = Arc::new(sink);
        SINK.lock().unwrap().replace(sink.clone());
        sink.sleep_until_end();

        Ok::<_, Box<dyn StdError + Send + Sync>>(())
    });

    let result = handle.await;

    log::info!("Audio started");

    match result {
        Ok(Ok(_)) => Ok(()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn pause_audio() -> Result<(), String> {
    match SINK.lock().unwrap().as_ref() {
        Some(sink) => sink.pause(),
        None => (),
    }

    log::info!("Paused audio");

    Ok(())
}

#[tauri::command]
async fn resume_audio() -> Result<(), String> {
    match SINK.lock().unwrap().as_ref() {
        Some(sink) => sink.play(),
        None => (),
    }

    log::info!("Resumed audio");

    Ok(())
}

#[tauri::command]
async fn reset_audio() -> Result<(), String> {
    match SINK.lock().unwrap().as_ref() {
        Some(sink) => {
            sink.clear();
        }
        None => (),
    }

    log::info!("Reset audio");

    Ok(())
}

#[tauri::command]
async fn time_remaining() -> Result<bool, String> {
    log::info!("Time remaining");

    match SINK.lock().unwrap().as_ref() {
        Some(sink) => Ok(!sink.empty()),
        None => Ok(true),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let shared_instance = AVAudioSession::shared_instance();
    shared_instance.set_category(Category::playback());

    let migrations = vec![
            Migration {
                version: 1,
                description: "create_initial_tables",
                sql: "
                        CREATE TABLE artists (id TEXT PRIMARY KEY, name TEXT);
                        CREATE TABLE albums (id TEXT PRIMARY KEY, name TEXT);
                        CREATE TABLE songs (id TEXT PRIMARY KEY, title TEXT);
                    ",
                kind: MigrationKind::Up,
            },
            Migration {
                version: 2,
                description: "update_initial_tables",
                sql: "
                        ALTER TABLE artists ADD coverArt TEXT;
                        ALTER TABLE artists ADD albumCount INTEGER;
                        ALTER TABLE artists ADD artistImageUrl TEXT;
                        ALTER TABLE artists ADD musicBrainzId TEXT;

                        ALTER TABLE albums ADD artist TEXT;
                        ALTER TABLE albums ADD artistId TEXT;
                        ALTER TABLE albums ADD year TEXT;
                        ALTER TABLE albums ADD coverArt TEXT;

                        ALTER TABLE songs ADD album TEXT;
                        ALTER TABLE songs ADD artist TEXT;
                        ALTER TABLE songs ADD year TEXT;
                        ALTER TABLE songs ADD albumId TEXT;
                        ALTER TABLE songs ADD artistId TEXT;
                        ALTER TABLE songs ADD coverArt TEXT;
                        ALTER TABLE songs ADD duration INTEGER;
                        ALTER TABLE songs ADD comment TEXT;
                    ",
                kind: MigrationKind::Up,
            },
            Migration {
                version: 3,
                description: "create_link_tables",
                sql: "
                        CREATE TABLE artist_albums (artistId TEXT, albumId TEXT, PRIMARY KEY (artistId, albumId));
                        CREATE TABLE album_songs (albumId TEXT, songId TEXT, PRIMARY KEY (albumId, songId));
                    ",
                kind: MigrationKind::Up,
            },
            Migration {
                version: 4,
                description: "create_settings_table",
                sql: "
                        CREATE TABLE settings (username TEXT, token TEXT, salt TEXT, server TEXT, PRIMARY KEY (username));
                    ",
                kind: MigrationKind::Up,
            },
            Migration {
                version: 5,
                description: "add_track_to_songs",
                sql: "
                        ALTER TABLE songs ADD track TEXT;
                    ",
                kind: MigrationKind::Up,
            },
            Migration {
                version: 6,
                description: "add_acappella_id",
                sql: "
                        ALTER TABLE songs ADD acappellaId TEXT;
                    ",
                kind: MigrationKind::Up,
            },
            Migration {
                version: 7,
                description: "create_recently_played_table",
                sql: "
                        CREATE TABLE recently_played (playedAt TEXT, songId TEXT, albumId TEXT, artistId TEXT)
                    ",
                kind: MigrationKind::Up,
            },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .build(),
        )
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:music.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            discover_cast_devices,
            connect_to_cast_device,
            cast_audio,
            play_audio,
            pause_audio,
            resume_audio,
            reset_audio,
            time_remaining,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
