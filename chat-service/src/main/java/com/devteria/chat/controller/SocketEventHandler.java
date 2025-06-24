package com.devteria.chat.controller;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SocketEventHandler {
    SocketIOServer server;

    @OnConnect
    public void onConnect(SocketIOClient client) {
        log.info("Client connected: {}", client.getSessionId().toString());
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        log.info("Client dis-connected: {}", client.getSessionId().toString());
    }

    @OnEvent("message")
    public void onMessage(SocketIOClient client, String data) {
        log.info("Message received from {}, data: {}", client.getSessionId().toString(), data);
    }

    @PostConstruct
    public void startServer() {
        server.start();
        server.addListeners(this);
        log.info("Socket.IO Server started");
    }

    @PreDestroy
    public void stopServer() {
        server.stop();
        log.info("Socket.IO Server gracefully stopped");
    }
}

