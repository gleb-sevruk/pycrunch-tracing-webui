<template>
  <span>
  <el-button v-if="!is_authenticated"
             size="mini"
             class="bg-apple-gray-2 mr-3"
             @click="cloud_sign_in_dialog_open = true"
             icon="el-icon-circle-close">Sign-in to Cloud</el-button>
  <el-dropdown v-if="is_authenticated"
               class="mr-3"
               size="mini"
               type="info"
               split-button

               @visible-change="cloud_dropdown_visible = !cloud_dropdown_visible"
               @click="navigateToCloudLibrary"
               @command="handleCommand"
  >
      My Cloud

    <el-dropdown-menu slot="dropdown" size="medium">
        <el-dropdown-item size="medium" :command="'navigateToCloudLibrary'">
          <router-link :to="'cloud-library'">
            <div class="text-large p-2">Recording Library</div>
          </router-link></el-dropdown-item>
      <el-dropdown-item size="medium" :command="'my-account'"><div
          class="text-large p-2">Account</div></el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
    <el-dialog :visible.sync="cloud_sign_in_dialog_open" width="80%">
        <pc-cloud-sign-in></pc-cloud-sign-in>
    </el-dialog>

    </span>
</template>

<script>
import { mapGetters } from 'vuex'
import PcCloudSignIn from '@/views/cloud/cloud-sign-in'

export default {
  name: 'header-cloud-menu',
  components: { PcCloudSignIn },
  data () {
    return {
      cloud_dropdown_visible: false,
      cloud_sign_in_dialog_open: false,
    }
  },
  methods: {
    handleCommand (command_name: string) {
      if (command_name === 'navigateToCloudLibrary') {
        this.navigateToCloudLibrary()
      } else {
        console.log(command_name)
        this.cloud_sign_in_dialog_open = true
      }
    },
    navigateToCloudLibrary () {
      console.log('navigateToCloudLibrary')
      this.$router.push('cloud-library')
    },
  },
  computed: {
    ...mapGetters('cloud', ['is_authenticated']),
  },
}
</script>

<style scoped>
.text-large {
  font-size: 1.5em;
}
</style>