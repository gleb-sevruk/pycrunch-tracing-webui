<template>
  <div class="root-sign-in">
    <h3 class="text-center mt-n4">PyTrace Cloud</h3>
    <div class="text-center mt-3">
      <img src="../../assets/logo@2x.png" width="77" height="77">
    </div>

    <div v-if="!is_authenticated" class="features  mt-4 mx-5 px-5">
      <ul class="features__list">
        <li class="e">Share trace files with others</li>
        <li class="e">Record on the remote machine and publish to the Cloud</li>
        <li class="e">Easily debug test failures on CI</li>
      </ul>
    </div>
    <div v-if="is_authenticated" class="account-details d-flex flex-column text-center justify-content-center mt-4 mx-5 px-5">
      <div class="text-white-50 ">You are currently signed in as:</div>
      <div v-if="jwt_parsed">
        <div class="mt-3 font-size-2 font-weight-bolder">{{jwt_parsed.fullname}}</div>
        <div class="mt-2">{{jwt_parsed.email}}</div>
      </div>
      <hr class="w-100"/>

    </div>
    <div v-if="is_authenticated">
      <div class="d-flex justify-content-center">
        <pc-cloud-storage-usage class="w-50"></pc-cloud-storage-usage>
      </div>
      <div class="sign-out text-center mt-5 pt-3">
        <el-button @click="willStartLogOut" size="mini" type="info">Log out...</el-button>
      </div>
    </div>

    <div v-if="!is_authenticated" class="sign-in text-center mt-5">
      <div class="text-secondary">Sign-in or register using the button bellow to start for free</div>

      <el-button @click="initiateSignIn()" class="mt-4 google__button bg-white text-danger font-roboto google-shadow">
        <img class="mr-2" src="../../assets/google_icon@2x.png" width="18" height="18">
        Sign in with Google
      </el-button>
    </div>
    <div class="give-me-breath mt-2 pb-2"></div>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from 'vuex'
import axios from 'axios'
import jwt_decode from "jwt-decode";
import PcCloudStorageUsage from '@/views/cloud/cloud-storage-usage.component'

export default {
  name: 'pc-cloud-sign-in',
  components: { PcCloudStorageUsage },
  computed: {
    ...mapState('cloud', ['api_url', 'access_token', 'is_authenticated']),
    ...mapGetters('cloud', ['is_authenticated']),
    jwt_parsed () {
      if (!this.access_token) {
        return 'no-token'
      }
      return jwt_decode(this.access_token)
    },
  },
  methods: {
    ...mapMutations('cloud', ['set_access_token', 'logOut']),
    willStartLogOut() {
      this.logOut()
      this.$router.push('/')
    },
    async initiateSignIn () {
      try {
        const authCode = await this.$gAuth.getAuthCode()
        console.log(1)
        const response = await axios.post(this.api_url + '/one-time-token', {
          code: authCode,
          redirect_uri: 'postmessage',
        })
        console.log(2)
        let data = response.data
        if (data.access_token) {
          console.log(3)
          this.set_access_token(data.access_token)
          console.log(4)
        }

      } catch (e) {
        console.log('wtf', e)
      }

    },
  },
}
</script>

<style scoped>
.features__list {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.e {
  font-weight: 500;
  font-size: 1.3em;
  line-height: 2.5em;
  list-style: '-   ';
}

.font-roboto {
  font-family: Roboto, sans-serif !important;

  line-height: 18px;
}

.google-shadow {
  box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.33), 0 1px 1px 0 rgba(0, 0, 0, 0.3);
}

.google__button {
  background: #ffffff !important;
  box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.12), 0 1px 1px 0 rgba(0, 0, 0, 0.24);
  border-radius: 2px;
  font-weight: 500;
  font-size: 1.3em;

  /*color: rgba(255, 255, 255, 1) !important;*/
  color: rgba(0, 0, 0, 0.64) !important;

}
</style>