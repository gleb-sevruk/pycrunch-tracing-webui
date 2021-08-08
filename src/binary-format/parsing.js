// @flow
import global_state from '../store/global_state'
import { FileHeader, FileSection, Version } from '../store/tracer-binary.file'
import { EventBus } from '../shared/event-bus'
import { FileWithId, parse_files_with_contents_from_pb, parse_protobuf_datastream } from '../store/protobuf_message_parsing'
import { ActionContext } from 'vuex'

export const TLV_TAGS = {
   TRACE_TAG_HEADER : 1,
   TRACE_TAG_EVENTS : 2,
   TRACE_TAG_FILES : 3,
   TRACE_TAG_METADATA : 4,
}

/**

 *
 * @param tags_to_read - array of tags to scan, ignore huge events chunks
 * @param real_load - should state be mutated after loading
 * @return {*}
 */

/**
 * forEach for object
 */
export function read_binary_file (
  context: ActionContext,
  name: string,
  buffer: ArrayBuffer,
  tags_to_read: ?Array<string> = undefined,
  real_load: boolean = true
) {

  //pre setup



  const HEADER_TAG_VERSION = 1
  const HEADER_TAG_FILES = 2
  const HEADER_TAG_METADATA = 3

  function readInt32 () {
    let tag = z.getInt32(offset)
    offset += 4
    return tag
  }

  function read_uint64 (from_data_view: DataView, at_offset: number) {
    // const bytes = new Uint8Array([ 0xff,0xff,0xff,0xff,   0xff,0xff,0xff,0xff ]);
    // split 64-bit number into two 32-bit numbers

    // combine the 2 32-bit numbers using max 32-bit val 0xffffffff
    let right = from_data_view.getUint32(at_offset)  // 4294967295
    let left = from_data_view.getUint32(at_offset + 4) // 4294967295
    return left + 2 ** 32 * right
  }

  // transactional loading?
  if (real_load){
    global_state.clear()
  }

  let total_length = buffer.byteLength
  let json_metadata = null
  let z = new DataView(buffer)
  let header_size = 4
  let offset = 0
  // signature

  let h = new FileHeader()

  let signature = z.getInt32(offset)
  if (signature !== h.magic) {
    console.error('File signature is invalid')
    EventBus.$emit('trace_load_will_fail', name)
    return
  }
  offset += 4

  // tlv start
  let tag = z.getInt32(offset)
  offset += 4
  let version = new Version()

  if (tag === TLV_TAGS.TRACE_TAG_HEADER) {
    h.header_size = z.getInt32(offset)
    offset += 4
    // HEADER START
    let has_more_TLVs = true
    while (has_more_TLVs) {
      let tag = readInt32()
      if (tag === 0) {
        has_more_TLVs = false
        break
      }
      switch (tag) {
        case HEADER_TAG_VERSION:
          let len = readInt32()
          if (len !== 8) {
            throw 'Length is invalid, expected 8, got ' + len
          }
          version.major = readInt32()
          version.minor = readInt32()
          console.log('version', version)
          break
        case HEADER_TAG_FILES:
          let files_length = readInt32()
          if (files_length !== 16) {
            throw 'HEADER_TAG_FILES Length is invalid, expected 16, got ' + files_length
          }
          const event_stream_end_offset = read_uint64(z, offset)
          const files_byte_len = read_uint64(z, offset + 8)
          h.files_section = new FileSection('files', event_stream_end_offset + 4, files_byte_len)
          offset += files_length

          break
        case HEADER_TAG_METADATA:
          let metadata_length = readInt32()
          if (metadata_length !== 16) {
            throw 'HEADER_TAG_METADATA Length is invalid, expected 16, got ' + metadata_length
          }
          const metadata_begins_at = read_uint64(z, offset)
          const metadata_len = read_uint64(z, offset + 8)
          h.metadata_section = new FileSection('files', metadata_begins_at + 4, metadata_len)
          offset += metadata_length

          break
      }
    }

    // HEADER END

  }

  offset += 8
  // 12 = 4 sig + tag[4] + 4 header len
  offset = 4 + 4 + 4 + h.header_size
  signature = z.getInt32(offset)
  if (signature !== h.magic) {
    console.error('Trailing file signature is invalid')
    EventBus.$emit('trace_load_will_fail', name)
    return
  }
  offset += 4
  console.log('Signature verified')

  while (offset < total_length) {
    // console.log('offset', offset)
    // read next tlv
    tag = readInt32()
    // console.log('tag', tag)

    if (tags_to_read !== undefined) {
      // console.log('we only want to read metadata')
      // console.log('   tags_to_read !== undefined')

      let should_skip_current_section = tags_to_read.indexOf(tag) < 0
      if (should_skip_current_section) {
        let unknown_package_size = readInt32()
        offset += unknown_package_size
        continue
      }
    }

    switch (tag) {
      case TLV_TAGS.TRACE_TAG_EVENTS:
        let chunk_size = readInt32()

        let slice = buffer.slice(offset, offset + chunk_size)

        let msg = parse_protobuf_datastream(slice)
        global_state.add_to_command_buffer(msg.command_buffer)
        global_state.add_stacks(msg.stacks)

        msg.files.forEach((_: FileWithId) => {
          global_state.files[_.id] = _.file
        })

        offset += chunk_size
        break
      case TLV_TAGS.TRACE_TAG_FILES:
        let chunk_size_files = readInt32()

        let slice_files = buffer.slice(offset, offset + chunk_size_files)
        let msg_files = parse_files_with_contents_from_pb(slice_files)
        msg_files.files_contents.forEach(_ => {
          let enc = new TextDecoder()

          let contents = 'File cannot be loaded...'
          if (_.contents) {
            contents = enc.decode(_.contents)
          }
          let payload = {
            filename: global_state.file_at(_.id),
            contents: contents,
          }
          context.commit('file_did_load', payload)

        })
        offset += chunk_size_files
        break
      case TLV_TAGS.TRACE_TAG_METADATA:
        let metadata_chunk_size = readInt32()
        let slice_metadata = buffer.slice(offset, offset + metadata_chunk_size)
        let enc = new TextDecoder()
        let contents = enc.decode(slice_metadata)

        json_metadata = JSON.parse(contents)

        if (real_load) {
          context.commit('session_metadata_did_load', json_metadata)
        }


        offset += metadata_chunk_size

        break
      default:
        console.warn(tag, 'unknown tag, skipping')
        let unknown_package_size = readInt32()
        offset += unknown_package_size
        console.warn(unknown_package_size, 'bytes skipped')
        break
    }
  }

  if (real_load) {
    context.commit('update_filtered_events')
    context.commit('selected_index_will_change', 0)
    EventBus.$emit('new_file_did_load', {})
  }

  return json_metadata
}