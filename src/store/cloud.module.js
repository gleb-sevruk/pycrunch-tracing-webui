// @flow

import { API_ROOT } from '../config'
import axios from 'axios'
import Vuex, { ActionContext, Module } from 'vuex'
import { cleanUpOutdatedJWTs, getAccessToken, setJwtAccess } from '../auth/localStorageShim'

export class Recording {
  name: string
  id: string
  size_in_bytes: number
  total_events: number
  recording_date: string
}

export class CloudState {
  is_logged_in: boolean = false
  api_url: string = API_ROOT
  count: number = 0
  access_token: ?string = null
  refresh_token: ?string = null
  recordings: Array<Recording> = []
}

//

function createInitialState (): CloudState {
  let x = new CloudState()

  let jwt_access = getAccessToken()
  if (jwt_access) {
    x.access_token = jwt_access
  }
  return x
}

const moduleCloud : Module = {
  namespaced: true,
  state: createInitialState(),
  mutations: {
    increment (_state: CloudState) {
      _state.count++
    },
    set_access_token (_state: CloudState, newToken: string) {
      _state.access_token = newToken
      setJwtAccess(newToken)
      _state.is_logged_in = newToken != null
    },
    logOut (_state: CloudState, dummy: any) {
      _state.access_token = null
      cleanUpOutdatedJWTs()
      _state.is_logged_in = false
    },
    did_load_recordings (_state: CloudState, recordings: any) {
      _state.recordings.length = 0
      _state.recordings.push(...recordings)
    },
  },
  actions: {
    async load_recordings (_context: ActionContext, params: any) {
      let x = await axios.get(_context.state.api_url + '/recordings')

      _context.commit('did_load_recordings', x.data)
    },
  },
  getters: {
    is_authenticated: (_state: CloudState) => {
      return _state.access_token
    },
  },
}

export default moduleCloud