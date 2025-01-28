import Database from "@tauri-apps/plugin-sql";
import { nanoid } from "nanoid";

class Settings {
  #server = $state('https://motify.glo.quebec');
  #c = 'acapella';
  #u = $state('gamachexx');
  #t = $state('117bdf292a04278cf90344eed5b0876e');
  #s = '54f240';
  #f = 'json';
  #v = '1.16.1';
  #underscore = '1737483708692';

  get server() {
    return this.#server
  }

  set server(value) {
    this.#server = value
  }

  set user(value) {
    this.#u = value
  }

  get user() {
    return this.#u
  }

  url(keyword: string) {
    return `${this.#server}/rest/${keyword}?c=${this.#c}&u=${this.#u}&t=${this.#t}&s=${this.#s}&f=${this.#f}&v=${this.#v}&_=${this.#underscore}`
  }

  async save() {
    const db = await Database.load("sqlite:music.db");
    await db.execute(`DELETE FROM settings`)
    await db.execute(`INSERT INTO settings (server, username, token, salt) VALUES ($1, $2, $3, $4)`, [this.server, this.user, nanoid(), nanoid()])
    console.log('Settings saved', this.server, this.user)
    await db.close()
  }
}

export const settings = $state(new Settings())

export async function loadSettingsFromDB() {
  const db = await Database.load("sqlite:music.db")

  const settingsBD = await db.select("SELECT * FROM settings") as any[];

  console.log(settingsBD)

  // if (settingsBD.length > 0) {
  //   settings.server = settingsBD[0].server || ''
  //   settings.user = settingsBD[0].username || ''
  // }

  await db.close()
}

