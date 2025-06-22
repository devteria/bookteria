package com.devteria.identity.mapper;

import org.mapstruct.Mapper;

import com.devteria.identity.dto.request.ProfileCreationRequest;
import com.devteria.identity.dto.request.UserCreationRequest;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    ProfileCreationRequest toProfileCreationRequest(UserCreationRequest request);
}
