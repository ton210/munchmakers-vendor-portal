const axios = require('axios');

class TrackingService {
  constructor() {
    this.apiKey = process.env.TRACKSHIP_API_KEY;
    this.appName = process.env.TRACKSHIP_APP_NAME || 'VendorDashboard';
    this.apiUrl = 'https://api.trackship.info/v1';
  }

  async addTrackingNumber(orderId, trackingNumber, carrier, vendorAssignmentId) {
    try {
      const db = require('../config/database');

      // First, add to TrackShip
      const trackshipResponse = await axios.post(`${this.apiUrl}/trackers`, {
        tracking_number: trackingNumber,
        carrier: carrier.toLowerCase()
      }, {
        headers: {
          'TrackShip-API-Key': this.apiKey,
          'User-Agent': this.appName
        }
      });

      // Then save to our database
      const [tracking] = await db('order_tracking').insert({
        order_id: orderId,
        vendor_assignment_id: vendorAssignmentId,
        tracking_number: trackingNumber,
        carrier: carrier,
        tracking_url: trackshipResponse.data.tracking_url,
        status: 'shipped',
        shipped_date: new Date()
      }).returning('*');

      // Update order status
      await db('orders')
        .where('id', orderId)
        .update({
          order_status: 'shipped',
          updated_at: new Date()
        });

      return {
        success: true,
        data: {
          tracking,
          trackship_data: trackshipResponse.data
        }
      };

    } catch (error) {
      console.error('TrackShip API error:', error.response?.data || error.message);

      // Still save tracking info even if TrackShip fails
      try {
        const db = require('../config/database');
        const [tracking] = await db('order_tracking').insert({
          order_id: orderId,
          vendor_assignment_id: vendorAssignmentId,
          tracking_number: trackingNumber,
          carrier: carrier,
          status: 'shipped',
          shipped_date: new Date(),
          notes: 'TrackShip sync failed, manual tracking'
        }).returning('*');

        return {
          success: true,
          data: { tracking },
          warning: 'Tracking saved but TrackShip sync failed'
        };
      } catch (dbError) {
        throw new Error(`Failed to save tracking: ${dbError.message}`);
      }
    }
  }

  async updateTrackingStatus(trackingId, status, notes) {
    try {
      const db = require('../config/database');

      const [tracking] = await db('order_tracking')
        .where('id', trackingId)
        .update({
          status,
          notes,
          delivered_date: status === 'delivered' ? new Date() : null,
          updated_at: new Date()
        })
        .returning('*');

      // If delivered, update order status
      if (status === 'delivered') {
        await db('orders')
          .where('id', tracking.order_id)
          .update({
            order_status: 'fulfilled',
            updated_at: new Date()
          });
      }

      return { success: true, data: tracking };

    } catch (error) {
      console.error('Update tracking error:', error.message);
      throw new Error(`Failed to update tracking: ${error.message}`);
    }
  }

  async getTrackingInfo(orderId) {
    try {
      const db = require('../config/database');

      const tracking = await db('order_tracking')
        .where('order_id', orderId)
        .orderBy('created_at', 'desc');

      // Get latest status from TrackShip for each tracking number
      const enrichedTracking = [];
      for (const track of tracking) {
        try {
          const trackshipResponse = await axios.get(
            `${this.apiUrl}/trackers/${track.tracking_number}`,
            {
              headers: {
                'TrackShip-API-Key': this.apiKey,
                'User-Agent': this.appName
              }
            }
          );

          enrichedTracking.push({
            ...track,
            trackship_data: trackshipResponse.data,
            latest_status: trackshipResponse.data.status
          });

        } catch (trackshipError) {
          // If TrackShip fails, use our stored data
          enrichedTracking.push({
            ...track,
            latest_status: track.status
          });
        }
      }

      return { success: true, data: enrichedTracking };

    } catch (error) {
      console.error('Get tracking error:', error.message);
      throw new Error(`Failed to get tracking info: ${error.message}`);
    }
  }

  async syncAllTracking() {
    try {
      const db = require('../config/database');

      // Get all active tracking numbers
      const trackingNumbers = await db('order_tracking')
        .where('status', '!=', 'delivered')
        .select('id', 'tracking_number', 'carrier', 'order_id');

      let syncedCount = 0;
      let deliveredCount = 0;

      for (const track of trackingNumbers) {
        try {
          const trackshipResponse = await axios.get(
            `${this.apiUrl}/trackers/${track.tracking_number}`,
            {
              headers: {
                'TrackShip-API-Key': this.apiKey,
                'User-Agent': this.appName
              }
            }
          );

          const newStatus = trackshipResponse.data.status;

          // Update our tracking record
          await db('order_tracking')
            .where('id', track.id)
            .update({
              status: newStatus,
              delivered_date: newStatus === 'delivered' ? new Date() : null,
              updated_at: new Date()
            });

          // Update order status if delivered
          if (newStatus === 'delivered') {
            await db('orders')
              .where('id', track.order_id)
              .update({
                order_status: 'fulfilled',
                updated_at: new Date()
              });
            deliveredCount++;
          }

          syncedCount++;

        } catch (trackError) {
          console.log(`Failed to sync tracking ${track.tracking_number}:`, trackError.message);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        message: `Synced ${syncedCount} tracking numbers, ${deliveredCount} orders delivered`,
        data: { syncedCount, deliveredCount }
      };

    } catch (error) {
      console.error('Sync all tracking error:', error.message);
      throw new Error(`Failed to sync tracking: ${error.message}`);
    }
  }

  getSupportedCarriers() {
    return [
      'UPS', 'FedEx', 'USPS', 'DHL', 'TNT', 'Royal Mail', 'Canada Post',
      'Australia Post', 'Deutsche Post', 'La Poste', 'PostNL', 'Swiss Post'
    ];
  }
}

module.exports = TrackingService;