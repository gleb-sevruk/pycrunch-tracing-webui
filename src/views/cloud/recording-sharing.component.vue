<template>
  <div class="sharing-modal__root">
    <div class="suggestions text-white-50">Type user email to invite here</div>
    <div v-loading="loading"></div>
    <el-autocomplete
        class="mt-3 inline-input"
        v-model="input_email"
        :fetch-suggestions="querySearch"
        placeholder="Email"
        :trigger-on-focus="false"
        size="small"
        @select="willSelectSuggestion"
    ></el-autocomplete>
    <el-button @click="sendInvite" lass="ml-3" size="small" icon="el-icon-plus">Send Invite</el-button>
    <div class="mt-5">
      <el-switch
          v-model="link_sharing"
          @change="changeLinkShare"
          active-text="Available by public url"
      ></el-switch>
      <div class="mt-2">
        <div v-if="public_url">
          <a :href="full_public_url" class="text-danger" target="_blank" rel="noopener noreferrer" ref="public_link">
            {{ full_public_url }}
          </a>
          <el-button size="small" class="ml-3" @click="copy_url">Copy</el-button>
        </div>

      </div>
    </div>
    <div class="collaborators">
      <div class="mt-5">Invited so far:</div>
      <div class="single-collaborator p-2" v-for="email in collabs">
        <div class="d-flex align-items-center w-50 justify-content-between">
          {{ email }}
          <el-button @click="removeCollaborator(email)">x</el-button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { API_ROOT } from '@/config'

export default {
  name: 'pc-recording-sharing',
  props: {
    recording_id: {
      type: String,
      required: true,
    },
  },
  data () {
    return {
      loading: false,
      input_email: '',
      link_sharing: false,
      public_url: null,
      collabs: [],

    }
  },
  methods: {
    copy_url () {
      const el = document.createElement('textarea')
      el.value = this.full_public_url
      el.setAttribute('readonly', '')
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      if (selected) {
        document.getSelection().removeAllRanges()
        document.getSelection().addRange(selected)
      }
    },
    async removeCollaborator (email_to_remove) {
      let url = `${API_ROOT}/recordings/${this.recording_id}/sharing/by-email`
      let x = await axios.delete(url, { data: { email: email_to_remove } })
      await this.load()
      // this.collabs = x.data.shared_with

    },
    async sendInvite () {
      let re = /\S+@\S+\.\S+/
      if (!re.test(this.input_email)) {
        this.$notify.error('Invalid email')
        return
      }
      let url = `${API_ROOT}/recordings/${this.recording_id}/sharing/by-email`
      let x = await axios.post(url, { email: this.input_email })
      this.collabs = x.data.shared_with

    },
    async changeLinkShare (should_be_publicly_shared) {
      let url = `${API_ROOT}/recordings/${this.recording_id}/sharing/by-link`
      if (should_be_publicly_shared) {
        let sharing_pref = await axios.post(url)
        this.public_url = sharing_pref.data.public_url

      } else {
        let sharing_pref = await axios.delete(url)
        this.public_url = null

      }
      console.log(should_be_publicly_shared)
    },
    async load () {
      this.loading = true
      let sharing_pref = await axios.get(`${API_ROOT}/recordings/${this.recording_id}/sharing`)
      sharing_pref = sharing_pref.data
      //    recording_id: uuid.UUID
      // has_public_access: bool
      // public_url: str = None
      // shared_with: list[str]
      this.link_sharing = sharing_pref.has_public_access
      this.collabs = sharing_pref.shared_with
      this.public_url = sharing_pref.public_url
      this.front_url = sharing_pref.front_url
      this.loading = false

    },
    querySearch (queryString, cb) {
      // var links = this.links;
      // var results = queryString ? links.filter(this.createFilter(queryString)) : links;
      // call callback function to return suggestions

      cb([
        { 'value': 'vue' },
        { 'value': 'hue' },
      ])
    },
    willSelectSuggestion (item) {
      console.log(item)
    },

  },
  computed: {
    full_public_url () {
      return this.front_url + '/?shared=' + this.public_url
    },
  },
  async mounted () {
    await this.load()
  },
}
</script>

<style scoped>

</style>