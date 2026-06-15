package com.sabahub.repository;

import com.sabahub.domain.ReelAudio;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReelAudioRepository extends MongoRepository<ReelAudio, String> {
    List<ReelAudio> findByAuthorId(String authorId);
}
