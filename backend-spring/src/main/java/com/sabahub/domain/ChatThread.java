package com.sabahub.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "chat_threads")
public class ChatThread {

    public enum Type {
        DIRECT,
        GROUP,
        CHANNEL
    }

    @Id
    private String id;

    @Indexed
    private List<String> participantIds;

    private Type type;

    private String groupName;

    private String channelDescription;

    private String ownerUserId;

    private Boolean memberMessagingEnabled;

    private String mergedIntoThreadId;

    private Instant lastMessageAt;

    private String lastMessage;

    private String lastMessageSenderId;

    private String pinnedMessageId;

    private Map<String, Instant> lastReadAtByUser;

    private List<String> pinnedByUserIds;

    private List<String> mutedByUserIds;

    private List<String> archivedByUserIds;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public List<String> getParticipantIds() { return participantIds; }
    public void setParticipantIds(List<String> participantIds) { this.participantIds = participantIds; }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }

    public String getChannelDescription() { return channelDescription; }
    public void setChannelDescription(String channelDescription) { this.channelDescription = channelDescription; }

    public String getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(String ownerUserId) { this.ownerUserId = ownerUserId; }

    public Boolean getMemberMessagingEnabled() { return memberMessagingEnabled; }
    public void setMemberMessagingEnabled(Boolean memberMessagingEnabled) { this.memberMessagingEnabled = memberMessagingEnabled; }

    public String getMergedIntoThreadId() { return mergedIntoThreadId; }
    public void setMergedIntoThreadId(String mergedIntoThreadId) { this.mergedIntoThreadId = mergedIntoThreadId; }

    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

    public String getLastMessageSenderId() { return lastMessageSenderId; }
    public void setLastMessageSenderId(String lastMessageSenderId) { this.lastMessageSenderId = lastMessageSenderId; }

    public String getPinnedMessageId() { return pinnedMessageId; }
    public void setPinnedMessageId(String pinnedMessageId) { this.pinnedMessageId = pinnedMessageId; }

    public Map<String, Instant> getLastReadAtByUser() { return lastReadAtByUser; }
    public void setLastReadAtByUser(Map<String, Instant> lastReadAtByUser) { this.lastReadAtByUser = lastReadAtByUser; }

    public List<String> getPinnedByUserIds() { return pinnedByUserIds; }
    public void setPinnedByUserIds(List<String> pinnedByUserIds) { this.pinnedByUserIds = pinnedByUserIds; }

    public List<String> getMutedByUserIds() { return mutedByUserIds; }
    public void setMutedByUserIds(List<String> mutedByUserIds) { this.mutedByUserIds = mutedByUserIds; }

    public List<String> getArchivedByUserIds() { return archivedByUserIds; }
    public void setArchivedByUserIds(List<String> archivedByUserIds) { this.archivedByUserIds = archivedByUserIds; }
}
