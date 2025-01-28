import Database from "@tauri-apps/plugin-sql";
import { nanoid } from "nanoid";
import md5 from "md5";

class Settings {
  #server = $state('');
  #c = 'acapella';
  #u = $state('');
  #p = $state('');
  #t = $derived.by(() => {
    if (this.#p === '') {
      return ''
    }
    return md5(this.#p + this.#s)
  })
  #s = nanoid(6);
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

  get token() {
    return this.#t
  }

  get salt() {
    return this.#s
  }

  set password(value: string) {
    this.#p = value
  }

  url(keyword: string) {
    if (this.#server === '' || this.#u === '' || this.#p === '' || this.#s === '') {
      return ''
    }

    return `${this.#server}/rest/${keyword}?c=${this.#c}&u=${this.#u}&t=${this.#t}&s=${this.#s}&f=${this.#f}&v=${this.#v}&_=${this.#underscore}`
  }

  async save() {
    const db = await Database.load("sqlite:music.db");
    await db.execute(`DELETE FROM settings`)
    await db.execute(`INSERT INTO settings (server, username, token, salt) VALUES ($1, $2, $3, $4)`, [this.server, this.user, this.#p, ''])
    await db.close()
  }

  async login(user: string, password: string, server: string) {
    this.user = user
    this.password = password
    this.server = server

    await this.save()
  }
}

export const settings = $state(new Settings())

export async function loadSettingsFromDB() {
  const db = await Database.load("sqlite:music.db")

  const settingsBD = await db.select("SELECT * FROM settings") as any[];

  if (settingsBD.length > 0) {
    settings.server = settingsBD[0].server || ''
    settings.user = settingsBD[0].username || ''
    settings.password = settingsBD[0].token || ''
  }

  await db.close()
}

