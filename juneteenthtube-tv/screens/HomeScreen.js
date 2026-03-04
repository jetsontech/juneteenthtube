import { StyleSheet, TouchableOpacity, Text, View, FlatList, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export default function HomeScreen({ navigation }) {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChannels();
    }, []);

    async function fetchChannels() {
        try {
            const { data, error } = await supabase
                .from('channels')
                .select('*')
                .order('order_index');

            if (error) {
                console.error("Error fetching channels:", error);
            } else {
                setChannels(data || []);
            }
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#e50914" />
            </View>
        );
    }

    const renderChannel = ({ item }) => (
        <TouchableOpacity
            style={styles.channelCard}
            onPress={() => navigation.navigate('Player', { channel: item })}
            activeOpacity={0.8}
            // Add TV directional navigation hints if needed
            focusable={true}
        >
            <View style={styles.logoContainer}>
                {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} style={styles.logo} resizeMode="contain" />
                ) : (
                    <Text style={styles.logoText}>{item.name}</Text>
                )}
            </View>
            <View style={styles.channelInfo}>
                <Text style={styles.channelName}>{item.name}</Text>
                {item.description && <Text style={styles.channelDesc} numberOfLines={2}>{item.description}</Text>}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>JuneteenthTube TV</Text>
            <FlatList
                data={channels}
                keyExtractor={item => item.id.toString()}
                renderItem={renderChannel}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        padding: 20,
        paddingTop: 40,
        backgroundColor: '#111',
    },
    list: {
        padding: 10,
    },
    channelCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        marginBottom: 10,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    channelCardFocused: {
        borderColor: '#e50914', // highlight when focused by TV remote
    },
    logoContainer: {
        width: 120,
        height: 80,
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '80%',
        height: '80%',
    },
    logoText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    channelInfo: {
        flex: 1,
        padding: 15,
        justifyContent: 'center',
    },
    channelName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    channelDesc: {
        color: '#aaa',
        fontSize: 14,
    }
});
