import Database from "@tauri-apps/plugin-sql";
import type { Album, Artist, Song } from "./music";
import { nanoid } from "nanoid";
import { settings } from "../settings/store.svelte";

export const url = (keyword: string, params?: string[]) =>
  `${settings.url(keyword)}${["", ...(params || [])]?.join("&") || ""}`;

let artists = $state([] as Array<Artist>),
  albums = $state([] as Array<Album>),
  songs = $state([] as Array<Song>),
  loadingArtists = $state(false),
  loadingAlbums = $state(false),
  loadingSongs = $state(false),
  mostPlayed = $state([] as Array<Album>),
  recentlyPlayed = $state([] as Array<Album>);

export async function doScan() {
  loadingArtists = true;
  loadingAlbums = true;
  loadingSongs = true;

  const artistsResponse = await fetch(url("getArtists"));
  const artistsData = await artistsResponse.json();

  const artistIds = (
    artistsData["subsonic-response"]["artists"]["index"] as Array<any>
  ).reduce((acc, index) => {
    const artists = index["artist"];
    return acc.concat(artists);
  }, [] as Array<Artist>);

  loadingArtists = false;
  artists = artistIds;
  artists.sort((a, b) => a["name"].localeCompare(b["name"]));


  const albumPromises = artistIds.map((artist: any) =>
    fetch(url("getArtist", [`id=${artist["id"]}`])),
  );
  const albumsResponses = await Promise.all(albumPromises);
  const albumsData = await Promise.all(
    albumsResponses.map((response) => response.json()),
  );
  const albumIds = albumsData.reduce((acc, albumData) => {
    const albums = albumData["subsonic-response"]["artist"]["album"];
    if (!albums) {
      return acc;
    }
    const concatenatedAlbums = acc.concat(albums);
    return concatenatedAlbums;
  }, [] as Array<Album>);

  loadingAlbums = false;
  albums = albumIds;
  albums.sort((a, b) => a["name"].localeCompare(b["name"]));

  const tracksPromises: Array<PendingPromise> = albumIds.map(
    (album: any) =>
      new PendingPromise((resolve: any) =>
        resolve(
          fetch(url("getAlbum", [`id=${album["id"]}`])).then((r) => r.json()),
        ),
      ),
  );

  const tracksArrays = divideArrayInNArrays(tracksPromises, 10);

  const data: Array<Song> = [];
  for (const tracksArray of tracksArrays) {
    const tracksData: any = await Promise.all(
      tracksArray.map(async (p) => await p.execute()),
    );
    const sogns = tracksData.reduce((acc: any, trackData: any) => {
      const sogns = trackData["subsonic-response"]["album"]["song"];

      sogns.forEach((song: any) => {
        song["acappellaId"] = nanoid();
      })
      return acc.concat(sogns);
    }, []);
    data.push(...sogns);
  }

  songs = data;
  albums.forEach((album) => {
    album.songs = data.filter((song: any) => song.albumId === album.id);
  })
  artists.forEach((artist) => {
    artist.albums = albums.filter((album: any) => album.artistId === artist.id);
  })
  loadingSongs = false;

  await saveToDB(songs, artists, albums);
}

async function saveToDB(songs: Song[], artists: Artist[], albums: Album[]) {

  const db = await Database.load("sqlite:music.db");

  const resultDelete = await db.execute(`
                        DELETE FROM album_songs;
                        DELETE FROM artist_albums;
                        DELETE FROM songs;
                        DELETE FROM albums;
                        DELETE FROM artists;
                      `,
  )

  const songValues = 12
  const songInsert = "INSERT INTO songs (id, title, album, artist, year, track, albumId, artistId, coverArt, duration, comment, acappellaId) VALUES"

  const artistValues = 6
  const artistInsert = "INSERT INTO artists (id, name, coverArt, albumCount, artistImageUrl, musicBrainzId) VALUES"

  const albumValues = 6
  const albumInsert = "INSERT INTO albums (id, name, artistId, artist, year, coverArt) VALUES"

  const dividedSongs = divideArrayInNArrays(songs, 10)

  const insertSongsBatched = dividedSongs.map(songs => {
    return [`${songInsert} ${songs.map((_, index) => `($${Array.from({ length: songValues }, (_, i) => index * songValues + i + 1).join(", $")})`).join(", ")}`, songs] as [string, Song[]]
  })

  const insertAllArtists = `${artistInsert} ${artists.map((_, index) => `($${Array.from({ length: artistValues }, (_, i) => index * artistValues + i + 1).join(", $")})`).join(", ")}`

  const insertAllAlbums = `${albumInsert} ${albums.map((_, index) => `($${Array.from({ length: albumValues }, (_, i) => index * albumValues + i + 1).join(", $")})`).join(", ")}`

  const resultAllSongs = await Promise.all(insertSongsBatched.map(([query, songs]) => db.execute(query, songs.map((song) => [
    song["id"],
    song["title"],
    song["album"],
    song["artist"],
    song["year"],
    song["track"],
    song["albumId"],
    song["artistId"],
    song["coverArt"],
    song["duration"],
    song["comment"],
    song["acappellaId"],
  ]).flat())))

  let resultArtists = await db.execute(
    insertAllArtists,
    artists.map((artist) => [
      artist["id"],
      artist["name"],
      artist["coverArt"],
      artist["albumCount"],
      artist["artistImageUrl"],
      artist["musicBrainzId"],
    ]).flat(),
  )

  let resultAlbums = await db.execute(
    insertAllAlbums,
    albums.map((album) => [
      album["id"],
      album["name"],
      album["artistId"],
      album["artist"],
      album["year"],
      album["coverArt"],
    ]).flat(),
  )

  const albumSongsValues = 2
  const albumsSongsInsert = "INSERT into album_songs (albumId, songId) VALUES"

  const allAlbumSongsInsert = `${albumsSongsInsert} ${songs.map((_, index) => `($${Array.from({ length: albumSongsValues }, (_, i) => index * albumSongsValues + i + 1).join(", $")})`).join(", ")}`

  const resultAlbumSongs = await db.execute(
    allAlbumSongsInsert,
    songs.map((song) => [
      song["albumId"],
      song["id"],
    ]).flat(),
  )

  const artistAlbumsValues = 2
  const artistAlbumsInsert = "INSERT into artist_albums (artistId, albumId) VALUES"

  const allArtistAlbumsInsert = `${artistAlbumsInsert} ${albums.map((_, index) => `($${Array.from({ length: artistAlbumsValues }, (_, i) => index * artistAlbumsValues + i + 1).join(", $")})`).join(", ")}`

  const resultArtistAlbums = await db.execute(
    allArtistAlbumsInsert,
    albums.map((album) => [
      album["artistId"],
      album["id"],
    ]).flat(),
  )

  db.close();
}

class PendingPromise {
  args: any;
  constructor(args: any) {
    this.args = args;
  }

  execute() {
    return new Promise(this.args);
  }
}

export async function loadFromDB() {
  loadingArtists = true;
  loadingAlbums = true;
  loadingSongs = true;

  const db = await Database.load("sqlite:music.db");

  const artistsBD = await db.select("SELECT * from artists") as any[];
  const albumsBD = await db.select("SELECT * from albums") as any[];
  const songsBD = await db.select("SELECT * from songs") as any[];

  const artistAlbumsBD = await db.select("SELECT * from artist_albums") as any[];
  const albumSongsBD = await db.select("SELECT * from album_songs") as any[];

  const artistAlbumsMap = artistAlbumsBD.reduce((acc: any, artistAlbum: any) => {
    if (!acc[artistAlbum["artistId"]]) {
      acc[artistAlbum["artistId"]] = [];
    }
    acc[artistAlbum["artistId"]].push(artistAlbum["albumId"]);
    return acc;
  }, {});

  const albumSongsMap = albumSongsBD.reduce((acc: any, albumSong: any) => {
    if (!acc[albumSong["albumId"]]) {
      acc[albumSong["albumId"]] = [];
    }
    acc[albumSong["albumId"]].push(albumSong["songId"]);
    return acc;
  }, {});


  const albumSongs = albumsBD.map((album: Album) => {
    album["songs"] = albumSongsMap[album["id"]].map((songId: string) => songsBD.find((song: Song) => song["id"] === songId)) || [];
    return album;
  });

  const artistAlbums = artistsBD.map((artist: Artist) => {
    artist["albums"] = artistAlbumsMap[artist["id"]]?.map((albumId: string) => albumsBD.find((album: Album) => album["id"] === albumId)) || [];
    return artist;
  });

  albums = albumSongs;
  artists = artistAlbums;
  songs = songsBD as any;

  loadingArtists = false;
  loadingAlbums = false;
  loadingSongs = false;

  const recentPlayedResults = await db.select<any[]>(
    "SELECT * FROM recently_played ORDER BY playedAt DESC",
  );

  const albumIds = recentPlayedResults.map((album) => album.albumId) as string[];
  recentlyPlayed = getAlbumsBy(keepOnlyFirstInstance(albumIds));

  const mostPlayedByIds = albums.reduce(reduceToMostPlayedAlbums, {})
  mostPlayed = getAlbumsBy(Object.keys(mostPlayedByIds).sort((a, b) => mostPlayedByIds[b] - mostPlayedByIds[a]));

  albums.sort((a: Album, b: Album) => a["name"].localeCompare(b["name"]));
  artists.sort((a: Artist, b: Artist) => a["name"].localeCompare(b["name"]));

  db.close();
}

export function reduceToMostPlayedAlbums(acc: { [key: string]: number }, album: Album) {
  if (!acc[album["id"]]) {
    acc[album["id"]] = 0;
  }
  acc[album["id"]] += 1;
  return acc;
}

export async function updateRecentlyPlayed(song: Song) {
  const db = await Database.load("sqlite:music.db");
  await db.execute("INSERT INTO recently_played (playedAt, songId, albumId, artistId) VALUES ($1, $2, $3, $4)", [new Date().toISOString(), song.id, song.albumId, song.artistId])
  await db.close()

  const albums = getAlbumsBy([song.albumId]).concat(recentlyPlayed);
  recentlyPlayed = keepOnlyFirstInstance(albums);
}

function keepOnlyFirstInstance(array: Array<any>) {
  const seen = new Set();
  return array.filter((item) => {
    if (seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  });
}

export function divideArrayInNArrays<T>(
  array: Array<T>,
  n: number,
): Array<Array<T>> {
  const chunkSize = Math.ceil(array.length / n);
  return Array.from({ length: n }, (_, i) =>
    array.slice(i * chunkSize, (i + 1) * chunkSize),
  );
}

function generateNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNNumbers(n: number, min: number, max: number) {
  return Array.from({ length: n }, () => generateNumber(min, max));
}

export function getRandomAlbums() {
  const randomAlbumsIdxs = generateNNumbers(10, 0, albums.length - 1);
  return randomAlbumsIdxs.map((idx) => albums[idx]);
}

export function getRandomArtists() {
  const randomArtistsIdxs = generateNNumbers(10, 0, artists.length - 1);
  return randomArtistsIdxs.map((idx) => artists[idx]);
}

export function getRandomSongs() {
  const randomSongsIdxs = generateNNumbers(10, 0, songs.length - 1);
  return randomSongsIdxs.map((idx) => songs[idx]);
}

export function getAlbumsBy(ids: string[]): Album[] {
  return ids.map((id) => albums.find((album) => album["id"] === id)).filter((album) => album !== undefined);
}

export function getRecentlyPlayed() {
  return recentlyPlayed;
}

export function getMostPlayed() {
  return mostPlayed;
}

export function getArtists() {
  return artists;
}

export function getArtist(id: string) {
  return artists.find((artist) => artist["id"] === id);
}

export function getAlbums() {
  return albums;
}

export function getAlbum(id: string) {
  return albums.find((album) => album["id"] === id);
}

export function getSongs() {
  return songs;
}

export function getLoading() {
  return { loadingArtists, loadingAlbums, loadingSongs };
}

