import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export default function LiveTVPlayerScreen({ route }) {
    const { channel } = route.params;
    const [status, setStatus] = useState({});
    const video = useRef(null);

    // Make sure we use the local Nginx CDN stream URL or fallback
    // In our web app we proxy it through 8080, but for TV app maybe we just point 
    // to the actual server IP for testing. If running on emulator, 10.0.2.2 usually maps to host localhost.

    // Replace localhost with 10.0.2.2 for Android emulator to reach host machine
    const streamUrl = channel.stream_url ? channel.stream_url.replace('localhost', '10.0.2.2') : '';

    return (
        <View style={styles.container}>
            {streamUrl ? (
                <Video
                    ref={video}
                    style={styles.video}
                    source={{
                        uri: streamUrl,
                    }}
                    useNativeControls
                    shouldPlay
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                    onPlaybackStatusUpdate={status => setStatus(() => status)}
                />
            ) : (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No stream URL available</Text>
                </View>
            )}

            {/* Minimal overlay for channel info at the top */}
            <View style={styles.overlay}>
                <Text style={styles.channelName}>{channel.name}</Text>
                {status.isBuffering && (
                    <ActivityIndicator size="small" color="#e50914" style={{ marginLeft: 10 }} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    channelName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
    }
});
