package com.interviewbuddy.session.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Reads the former persisted status while always writing the current lifecycle values. */
@Converter
public class InterviewStatusConverter implements AttributeConverter<InterviewStatus, String> {

    @Override
    public String convertToDatabaseColumn(InterviewStatus status) {
        return status == null ? null : status.name();
    }

    @Override
    public InterviewStatus convertToEntityAttribute(String storedStatus) {
        if (storedStatus == null) return null;
        if ("NOT_STARTED".equals(storedStatus)) return InterviewStatus.CREATED;
        return InterviewStatus.valueOf(storedStatus);
    }
}
