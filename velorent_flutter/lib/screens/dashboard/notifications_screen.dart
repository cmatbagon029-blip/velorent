import 'package:flutter/material.dart';
import 'package:velorent_flutter/theme/app_theme.dart';
import 'package:velorent_flutter/services/api_service.dart';
import 'package:velorent_flutter/models/notification.dart';
import 'package:velorent_flutter/widgets/velo_loading.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:velorent_flutter/widgets/guest_placeholder.dart';
import 'package:velorent_flutter/widgets/pressable_scale.dart';
import 'package:intl/intl.dart';
import 'package:velorent_flutter/screens/chat/chat_list_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _isGuest = false;
  String _error = '';
  List<UserNotification> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final isGuest = await _apiService.isGuest();
      if (isGuest) {
        if (mounted) {
          setState(() {
            _isGuest = true;
            _isLoading = false;
          });
        }
        return;
      }

      final notifications = await _apiService.getNotifications();
      // Global unread count is now handled by the timer in MainLayout 
      // but we can refresh it here for immediate response
      _apiService.refreshUnreadCount();

      if (mounted) {
        setState(() {
          _isGuest = false;
          _notifications = notifications;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _markAsRead(UserNotification notification) async {
    if (notification.isRead) return;

    try {
      await _apiService.markNotificationAsRead(notification.id);
      if (mounted) {
        setState(() {
          final index = _notifications.indexWhere(
            (n) => n.id == notification.id,
          );
          if (index != -1) {
            _notifications[index] = UserNotification(
              id: notification.id,
              userId: notification.userId,
              message: notification.message,
              type: notification.type,
              status: 'read',
              createdAt: notification.createdAt,
              relatedRequestId: notification.relatedRequestId,
              relatedBookingId: notification.relatedBookingId,
            );
          }
        });
      }
      _apiService.refreshUnreadCount();
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    if (_notifications.every((n) => n.isRead)) return;

    try {
      await _apiService.markAllNotificationsAsRead();
      _loadNotifications();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  Future<void> _deleteNotification(UserNotification notification, int index) async {
    // 1. Remove from local list immediately for responsiveness
    setState(() {
      _notifications.removeAt(index);
    });

    bool wasUndone = false;

    // 2. Show Undo SnackBar
    if (mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      final snackBar = SnackBar(
        content: const Text('Notification deleted'),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'Undo',
          textColor: AppTheme.primaryGold,
          onPressed: () {
            wasUndone = true;
            // Restore to the local list
            setState(() {
              _notifications.insert(index, notification);
            });
          },
        ),
      );

      ScaffoldMessenger.of(context).showSnackBar(snackBar).closed.then((reason) {
        // 3. If NOT undone, proceed with API deletion
        if (!wasUndone && reason != SnackBarClosedReason.action) {
          _apiService.deleteNotification(notification.id).then((_) {
            _apiService.refreshUnreadCount();
          }).catchError((e) {
            debugPrint('Error deleting notification from server: $e');
            // If the server deletion fails, we might want to inform the user
            // but for simplicity here we just log it.
          });
        }
      });
    }
  }

  Future<void> _clearAllNotifications() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).cardTheme.color,
        title: const Text('Clear All Notifications'),
        content: const Text(
          'Are you sure you want to delete all notifications? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Clear All', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _apiService.clearAllNotifications();
      setState(() {
        _notifications.clear();
      });
      _apiService.refreshUnreadCount();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error clearing: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'booking_update':
        return Icons.directions_car_outlined;
      case 'request_update':
        return Icons.edit_calendar_outlined;
      case 'payment_success':
        return Icons.check_circle_outline;
      case 'payment_failed':
        return Icons.error_outline;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'payment_success':
        return Colors.green;
      case 'payment_failed':
        return Colors.red;
      case 'booking_update':
        return Theme.of(context).primaryColor;
      case 'request_update':
        return Colors.blue;
      default:
        return Theme.of(
              context,
            ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7) ??
            Colors.grey;
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final diff = now.difference(timestamp);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return DateFormat('MMM d, h:mm a').format(timestamp);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: _apiService.unreadChatCount,
            builder: (context, count, _) => Badge(
              label: Text(count.toString()),
              isLabelVisible: count > 0,
              child: IconButton(
                icon: const Icon(Icons.chat_outlined),
                onPressed: _isGuest 
                  ? null 
                  : () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const ChatListScreen()),
                    ).then((_) => _apiService.refreshUnreadCount()), // Refresh after returning
                tooltip: 'Messages',
              ),
            ),
          ),
          if (_notifications.any((n) => !n.isRead))
            TextButton(
              onPressed: _markAllAsRead,
              child: Text(
                'Mark all Read',
                style: TextStyle(
                  color: Theme.of(context).primaryColor,
                  fontSize: 13,
                ),
              ),
            ),
          if (_notifications.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_outlined, color: Colors.redAccent),
              onPressed: _clearAllNotifications,
              tooltip: 'Clear All',
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadNotifications,
        color: Theme.of(context).primaryColor,
        backgroundColor: Theme.of(context).cardTheme.color,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _notifications.isEmpty) {
      return const Center(child: VeloLoading());
    }

    if (_isGuest) {
      return const GuestPlaceholder(
        title: 'Notifications Hidden',
        message: 'Please sign in to your account to receive alerts and updates.',
        icon: Icons.notifications_off_outlined,
      );
    }

    if (_error.isNotEmpty && _notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
            const SizedBox(height: 16),
            Text(
              _error,
              style: TextStyle(
                color: Theme.of(
                  context,
                ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadNotifications,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGold,
              ),
              child: const Text('Retry', style: TextStyle(color: Colors.black)),
            ),
          ],
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_off_outlined,
              size: 64,
              color: Colors.grey[700],
            ),
            const SizedBox(height: 16),
            const Text(
              'No notifications yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Stay tuned for updates on your bookings!',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return AnimationLimiter(
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _notifications.length,
        separatorBuilder: (context, index) => Divider(
          color: Theme.of(context).dividerColor.withValues(alpha: 0.1),
          height: 1,
        ),
        itemBuilder: (context, index) {
          final notification = _notifications[index];
          return AnimationConfiguration.staggeredList(
            position: index,
            duration: const Duration(milliseconds: 375),
            child: SlideAnimation(
              verticalOffset: 50.0,
              child: FadeInAnimation(
                child: Dismissible(
                  key: Key('notification_${notification.id}'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    color: Colors.redAccent,
                    child: const Icon(Icons.delete_outline, color: Colors.white),
                  ),
                  onDismissed: (direction) {
                    _deleteNotification(notification, index);
                  },
                  child: _buildNotificationItem(notification),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotificationItem(UserNotification notification) {
    return PressableScale(
      onTap: () => _markAsRead(notification),
      child: Container(
        padding: const EdgeInsets.all(16),
        color: notification.isRead
            ? Colors.transparent
            : Theme.of(context).primaryColor.withValues(alpha: 0.05),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _getColorForType(notification.type).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getIconForType(notification.type),
                color: _getColorForType(notification.type),
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _formatTimestamp(notification.createdAt),
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                      if (!notification.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: Theme.of(context).primaryColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getTitleForType(notification.type),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: notification.isRead
                          ? FontWeight.normal
                          : FontWeight.bold,
                      color: Theme.of(context).textTheme.bodyLarge?.color,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    style: TextStyle(
                      color: notification.isRead
                          ? Theme.of(
                              context,
                            ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7)
                          : Theme.of(context).textTheme.bodyMedium?.color,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getTitleForType(String type) {
    switch (type) {
      case 'booking_update':
        return 'Booking Approved';
      case 'request_update':
        return 'Request Update';
      case 'payment_success':
        return 'Payment Received';
      case 'payment_failed':
        return 'Payment Failed';
      default:
        return 'New Notification';
    }
  }
}
