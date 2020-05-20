// @flow


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
  constructor (name, offset, length) {
    this.name = name
    this.offset = offset
    this.length = length

  }
}

export class FileHeader {
  magic: number = 15051991
  header_size : number
  // sections are in write order
  events_section: FileSection
  files_section : FileSection
  metadata_section: FileSection
}