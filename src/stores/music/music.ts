export type Artist = {
  id: string
  name: string
  coverArt: string
  albumCount: number
  artistImageUrl: string
  musicBrainzId: string
  albums: Array<Album>
}

export type Album = {
  id: string
  name: string
  artist: string
  artistId: string
  year: string
  coverArt: string
  songs: Array<Song>
}

export type Song = {
  id: string
  title: string
  album: string
  year: string
  artist: string
  albumId: string
  artistId: string
  coverArt: string
  duration: number
  comment: string
  track: string
  acappellaId: string
}
