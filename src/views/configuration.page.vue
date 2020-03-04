<template>
  <div class="about elevation-02 min-vh-100 p-3 pl-5">
    <h4>Session Configuration</h4>
<!--    <div>{{current_session}}</div>-->
    <div class="row">
      <div class="col-6">
        <div>Profiles</div>
        <el-button>Add Profile</el-button>
        <!--    <div>{{profiles}}</div>-->
        <el-card v-if="profiles" v-for="p in profiles" class="elevation-03">
          <div>{{p}}</div>
          <el-button @click="load_profile_details(p)">Edit</el-button>

        </el-card>
      </div>
      <div class="col-6">
        <el-card v-if="profile_details" class="elevation-03" :header="profile_details.profile_name">
        <div>Exclusions</div>
        <div class="small">Ignores files startswith or endswith specified strings</div>
          <hr>
          <el-form>
            <el-form-item>
              <div class="row">
                <div class="col-3">
                  <el-button @click="will_add_new_rule()">Add</el-button>

                </div>
                <div class="col-9">
                  <el-input v-model="current_new_filter" class="w-100" type="text" placeholder="Enter new ignore rule..."> </el-input>

                </div>

              </div>
            </el-form-item>
          </el-form>
          <div v-for="exclusion in profile_details.exclusions" class="p-2 m-2 elevation-02 text-light">
            <el-button class="bg-apple-gray-2 mr-2" @click="remove_ignore_rule(exclusion)" >Remove</el-button>
            {{exclusion}}
          </div>
          <hr>
          <div >
            <el-button @click="save_profile_details()">Save</el-button>
          </div>
        </el-card>
      </div>
    </div>

  </div>
</template>

<script>
  import {mapActions, mapGetters, mapMutations, mapState} from 'vuex'

  export default {
    name: 'pc-page-session-details',
    data () {
      return {
        slider_position: 1,
        current_new_filter: '',
      }
    },
    computed: {
      ...mapState(['current_session', 'profiles', 'profile_details']),
      ...mapGetters(['total_events', 'total_events_unfiltered'])
    },
    methods: {
      ...mapMutations(['selected_index_will_change', 'add_new_ignore_rule', 'remove_ignore_rule']),
      ...mapActions(['load_profile_details', 'save_profile_details']),
      will_add_new_rule() {
        this.add_new_ignore_rule(this.current_new_filter)
        this.current_new_filter = ''
      }
    },
  }
</script>
<style scoped>

</style>
