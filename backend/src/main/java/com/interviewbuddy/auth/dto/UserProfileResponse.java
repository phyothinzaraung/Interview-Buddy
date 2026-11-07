package com.interviewbuddy.auth.dto;

import com.interviewbuddy.auth.model.UserAccount;
import com.interviewbuddy.auth.model.UserRole;

public record UserProfileResponse(Long id, String name, String email, UserRole role) {
    public static UserProfileResponse from(UserAccount user) {
        return new UserProfileResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
