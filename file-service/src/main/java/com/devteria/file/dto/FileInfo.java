package com.devteria.file.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileInfo {
    String name;
    String contentType;
    long size;
    String md5Checksum;
    String path;
    String url;
}
