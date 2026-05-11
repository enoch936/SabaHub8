package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "chat_messages")
public class ChatMessage {

    public enum Type {
        TEXT,
        ASSET
    }

    @Id
    private String id;

    @Indexed
    private String threadId;

    @Indexed
    private String senderId;

    private Type type;

    private String text;

    private String assetId;

    private String replyToMessageId;

    private String forwardedFromMessageId;

    private Instant editedAt;

    private Instant deletedAt;

    private Boolean deletedForEveryone;

    private Map<String, List<String>> reactions;

    @CreatedDate
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }

    public String getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(String replyToMessageId) { this.replyToMessageId = replyToMessageId; }

    public String getForwardedFromMessageId() { return forwardedFromMessageId; }
    public void setForwardedFromMessageId(String forwardedFromMessageId) { this.forwardedFromMessageId = forwardedFromMessageId; }

    public Instant getEditedAt() { return editedAt; }
    public void setEditedAt(Instant editedAt) { this.editedAt = editedAt; }

    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    public Boolean getDeletedForEveryone() { return deletedForEveryone; }
    public void setDeletedForEveryone(Boolean deletedForEveryone) { this.deletedForEveryone = deletedForEveryone; }

    public Map<String, List<String>> getReactions() { return reactions; }
    public void setReactions(Map<String, List<String>> reactions) { this.reactions = reactions; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
