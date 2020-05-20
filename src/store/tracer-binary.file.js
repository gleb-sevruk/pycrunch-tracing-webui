// @flow


/*
General format

magic(i32) | header_size(i32) | header(bytes[header_size]) | magic(i32) | data(bytes[])


Header format

events_buffer_end(uint64)
files_start_at(uint64)
files_bytes_total(uint64)
metadata_offset(uint64)
metadata_total_bytes(uint64)

*/

export class  FileSection {
  name: string
  //
  // position in a file
  //
  offset: number
  //
  // bytes in section
  //
  length: number
  constructor (name: string, offset: number, length: number) {
    this.name = name
    this.offset = offset
    this.length = length

  }
}

export class Version {
  major: number
  minor: number
}

export class FileHeader {
  magic: number = 15051991
  header_size : number
  // sections are in write order
  events_section: FileSection
  files_section : FileSection
  metadata_section: FileSection
}