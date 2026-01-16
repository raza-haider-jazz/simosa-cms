import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private db: admin.database.Database | null = null;
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
        if (!projectId || !clientEmail || !privateKey || !databaseURL) {
            this.logger.warn('Firebase credentials not configured. Realtime notifications disabled.');
            this.logger.warn('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_URL to enable.');
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
                    databaseURL,
                });
            }
            this.db = admin.database();
            this.isInitialized = true;
            this.logger.log('Firebase initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Firebase:', error);
        }
    }

    async notifyLayoutSaved(userType?: string): Promise<boolean> {
        if (!this.isInitialized || !this.db) {
            this.logger.warn('Firebase not initialized, skipping notification');
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
