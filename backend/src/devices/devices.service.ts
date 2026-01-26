import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
    constructor(private prisma: PrismaService) {}

    /**
     * Register or update FCM token for a device
     * If deviceId exists, update the token; otherwise create new registration
     */
    async registerToken(data: {
        fcmToken: string;
        deviceId: string;
        platform: string;
    }) {
        const { fcmToken, deviceId, platform } = data;

        // Check if device already exists
        const existingDevice = await this.prisma.deviceRegistration.findFirst({
            where: { deviceId },
        });

        if (existingDevice) {
            // Update existing device with new FCM token
            return this.prisma.deviceRegistration.update({
                where: { id: existingDevice.id },
                data: {
                    fcmToken,
                    platform,
                    updatedAt: new Date(),
                },
            });
        }

        // Create new device registration
        return this.prisma.deviceRegistration.create({
            data: {
                fcmToken,
                deviceId,
                platform,
            },
        });
    }

    /**
     * Get all registered devices
     */
    findAll() {
        return this.prisma.deviceRegistration.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get devices by platform
     */
    findByPlatform(platform: string) {
        return this.prisma.deviceRegistration.findMany({
            where: { platform },
        });
    }

    /**
     * Get all FCM tokens for sending notifications
     */
    async getAllTokens(): Promise<string[]> {
        const devices = await this.prisma.deviceRegistration.findMany({
            select: { fcmToken: true },
        });
        return devices.map(d => d.fcmToken);
    }

    /**
     * Remove a device registration (e.g., when token becomes invalid)
     */
    async removeByToken(fcmToken: string) {
        return this.prisma.deviceRegistration.deleteMany({
            where: { fcmToken },
        });
    }

    /**
     * Remove by device ID
     */
    async removeByDeviceId(deviceId: string) {
        return this.prisma.deviceRegistration.deleteMany({
            where: { deviceId },
        });
    }
}
