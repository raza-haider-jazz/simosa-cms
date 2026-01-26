import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private db: admin.database.Database | null = null;
    private messaging: admin.messaging.Messaging | null = null;
    private isInitialized = false;

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const databaseURL = process.env.FIREBASE_DATABASE_URL;

        // Skip initialization if env vars are not set
        if (!projectId || !clientEmail || !privateKey) {
            this.logger.warn('Firebase credentials not configured. Push notifications disabled.');
            this.logger.warn('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to enable.');
            return;
        }

        try {
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                    databaseURL: databaseURL || undefined,
                });
            }
            
            // Initialize Realtime Database if URL is provided
            if (databaseURL) {
                this.db = admin.database();
            }
            
            // Initialize FCM Messaging
            this.messaging = admin.messaging();
            this.isInitialized = true;
            this.logger.log('Firebase initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Firebase:', error);
        }
    }

    /**
     * Send push notification to multiple devices via FCM
     */
    async sendPushNotification(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<{ success: boolean; message: string; successCount?: number; failureCount?: number; failedTokens?: string[] }> {
        if (!this.isInitialized || !this.messaging) {
            this.logger.warn('Firebase not initialized, skipping push notification');
            return {
                success: false,
                message: 'Firebase not initialized',
            };
        }

        if (tokens.length === 0) {
            return {
                success: false,
                message: 'No tokens provided',
            };
        }

        try {
            // Build the message payload
            const message: admin.messaging.MulticastMessage = {
                tokens,
                notification: {
                    title,
                    body,
                },
                data: data || {},
                // Android specific config
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default',
                    },
                },
                // iOS specific config
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            // Send to multiple devices
            const response = await this.messaging.sendEachForMulticast(message);
            
            this.logger.log(`Push notification sent: ${response.successCount} success, ${response.failureCount} failed`);

            // Collect failed tokens for cleanup
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    this.logger.warn(`Failed to send to token: ${tokens[idx].substring(0, 20)}... Error: ${resp.error?.message}`);
                }
            });

            return {
                success: response.successCount > 0,
                message: `Sent to ${response.successCount} devices, ${response.failureCount} failed`,
                successCount: response.successCount,
                failureCount: response.failureCount,
                failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
            };
        } catch (error) {
            this.logger.error('Failed to send push notification:', error);
            return {
                success: false,
                message: `Failed to send: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Send push notification to a single device
     */
    async sendToDevice(
        token: string,
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<{ success: boolean; message: string }> {
        if (!this.isInitialized || !this.messaging) {
            return { success: false, message: 'Firebase not initialized' };
        }

        try {
            const message: admin.messaging.Message = {
                token,
                notification: { title, body },
                data: data || {},
                android: {
                    priority: 'high',
                    notification: { sound: 'default', channelId: 'default' },
                },
                apns: {
                    payload: { aps: { sound: 'default', badge: 1 } },
                },
            };

            const response = await this.messaging.send(message);
            this.logger.log(`Push sent to device: ${response}`);
            return { success: true, message: 'Notification sent successfully' };
        } catch (error) {
            this.logger.error('Failed to send to device:', error);
            return {
                success: false,
                message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Notify via Realtime Database (existing method)
     */
    async notifyLayoutSaved(userType?: string): Promise<boolean> {
        if (!this.isInitialized || !this.db) {
            this.logger.warn('Firebase Realtime Database not initialized, skipping notification');
            return false;
        }

        try {
            await this.db.ref('cms_updates').push({
                event: 'LAYOUT_SAVED',
                userType: userType || 'ALL',
                timestamp: Date.now(),
                savedAt: new Date().toISOString(),
            });
            this.logger.log(`Layout saved notification sent for userType: ${userType || 'ALL'}`);
            return true;
        } catch (error) {
            this.logger.error('Failed to send Firebase notification:', error);
            return false;
        }
    }
}
