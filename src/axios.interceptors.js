// Receiving a 401 response is the server telling you,
// “you aren’t authenticated–either not authenticated at all or
// authenticated incorrectly–but please reauthenticate and try again.”

import axios from 'axios'
import store from './store'
import Vue from 'vue'
import { API_ROOT } from './config'

import Router from './router'
import { cleanUpOutdatedJWTs, getAccessToken } from '@/auth/localStorageShim'

axios.interceptors.request.use(
  reqConfig => {
    console.log(reqConfig.url)
    if (!reqConfig.url.startsWith(API_ROOT)) {
      // it means we are calling s3 api or something
      return reqConfig
    }
    let access = getAccessToken()
    if (access) {
      reqConfig.headers.authorization = 'Bearer ' + access;
    }
    return reqConfig;
  },
  err => Promise.reject(err),
);

function createAxiosResponseInterceptor() {
  const interceptor = axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response === undefined) {
        return Promise.reject(error);
      }

      // Reject promise if usual error
      if (error.response.status !== 401) {
        return Promise.reject(error);
      }

      /*
       * When response code is 401, try to refresh the token.
       * Eject the interceptor so it doesn't loop in case
       * token refresh causes the 401 response
       */
      axios.interceptors.response.eject(interceptor);
      console.log('localStorage.jwt_refresh_token', localStorage.jwt_refresh_token)
      return axios.post(API_ROOT + '/api/token/refresh/', {
        refresh: localStorage.jwt_refresh_token
      }).then(response => {
        // debugger
        console.log('response 2', response)
        localStorage.jwt_access_token = response.data.access

        store.commit('did_receive_jwt_tokens', response.data);
        // set same response to be retried
        error.response.config.headers.authorization = 'Bearer ' + response.data.access;
        return axios(error.config);
      }).catch(error => {
        cleanUpOutdatedJWTs()
        Router.push('/')
        return Promise.reject(error)
      }).finally(createAxiosResponseInterceptor)
    }
  );
}

createAxiosResponseInterceptor()