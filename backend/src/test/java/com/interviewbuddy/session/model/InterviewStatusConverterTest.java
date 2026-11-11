package com.interviewbuddy.session.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class InterviewStatusConverterTest {
    private final InterviewStatusConverter converter = new InterviewStatusConverter();

    @Test
    void mapsLegacyDatabaseValueToCreated() {
        assertThat(converter.convertToEntityAttribute("NOT_STARTED")).isEqualTo(InterviewStatus.CREATED);
    }

    @Test
    void readsAndWritesCurrentStatusValues() {
        for (InterviewStatus status : InterviewStatus.values()) {
            assertThat(converter.convertToEntityAttribute(status.name())).isEqualTo(status);
            assertThat(converter.convertToDatabaseColumn(status)).isEqualTo(status.name());
        }
    }
}
