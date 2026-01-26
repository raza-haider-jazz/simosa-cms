import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('devices')
export class DevicesController {
    constructor(
        private readonly devicesService: DevicesService,
        private readonly firebaseService: FirebaseService,
        private readonly prisma: PrismaService,
    ) {}

    /**
     * Register or update FCM token for a device
     * POST /devices/register
     */
    @Post('register')
    async registerToken(
        @Body() body: { fcmToken: string; deviceId: string; platform: string },
    ) {
        const device = await this.devicesService.registerToken(body);
        return {
            success: true,
            message: 'Device registered successfully',
            device,
        };
    }

    /**
     * Get all registered devices
     * GET /devices
     */
    @Get()
    async findAll() {
        return this.devicesService.findAll();
    }

    /**
     * Get devices by platform
     * GET /devices?platform=android
     */
    @Get('platform/:platform')
    async findByPlatform(@Param('platform') platform: string) {
        return this.devicesService.findByPlatform(platform);
    }

    /**
     * Send push notification to all devices
     * POST /devices/push
     */
    @Post('push')
    async pushNotification(
        @Body() body: { title: string; body: string; data?: Record<string, string>; imageUrl?: string },
    ) {
        const tokens = await this.devicesService.getAllTokens();
        
        if (tokens.length === 0) {
            return {
                success: false,
                message: 'No registered devices found',
            };
        }

        const result = await this.firebaseService.sendPushNotification(
            tokens,
            body.title,
            body.body,
            body.data,
        );

        // Store notification in database for tracking
        await this.prisma.notification.create({
            data: {
                title: body.title,
                body: body.body,
                targetType: 'all',
                imageUrl: body.imageUrl,
                status: result.success ? 'SENT' : 'FAILED',
                sentAt: new Date(),
            },
        });

        return result;
    }

    /**
     * Send push notification to specific device
     * POST /devices/push/:deviceId
     */
    @Post('push/:deviceId')
    async pushToDevice(
        @Param('deviceId') deviceId: string,
        @Body() body: { title: string; body: string; data?: Record<string, string> },
    ) {
        const devices = await this.devicesService.findAll();
        const device = devices.find(d => d.deviceId === deviceId);

        if (!device) {
            return {
                success: false,
                message: 'Device not found',
            };
        }

        const result = await this.firebaseService.sendPushNotification(
            [device.fcmToken],
            body.title,
            body.body,
            body.data,
        );

        return result;
    }

    /**
     * Remove device registration
     * DELETE /devices/:deviceId
     */
    @Delete(':deviceId')
    async removeDevice(@Param('deviceId') deviceId: string) {
        await this.devicesService.removeByDeviceId(deviceId);
        return {
            success: true,
            message: 'Device removed successfully',
        };
    }
}
