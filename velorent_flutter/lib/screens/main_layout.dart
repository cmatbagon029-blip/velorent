import 'package:flutter/material.dart';
import 'package:velorent_flutter/theme/app_theme.dart';
import 'package:velorent_flutter/screens/dashboard/dashboard_screen.dart';
import 'package:velorent_flutter/screens/profile/profile_screen.dart';
import 'package:velorent_flutter/screens/dashboard/my_rentals_screen.dart';
import 'package:velorent_flutter/screens/dashboard/my_requests_screen.dart';
import 'package:velorent_flutter/screens/dashboard/notifications_screen.dart';
import 'package:velorent_flutter/services/api_service.dart';
import 'dart:async';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;
  final ApiService _apiService = ApiService();
  Timer? _unreadTimer;

  @override
  void initState() {
    super.initState();
    _startUnreadTimer();
  }

  @override
  void dispose() {
    _unreadTimer?.cancel();
    super.dispose();
  }

  void _startUnreadTimer() {
    _unreadTimer = Timer.periodic(const Duration(seconds: 15), (timer) {
      _apiService.refreshUnreadCount();
    });
  }

  final List<Widget> _screens = [
    const DashboardScreen(),
    const MyRentalsScreen(),
    const MyRequestsScreen(),
    const NotificationsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Theme.of(context).dividerColor),
          ),
        ),
        child: BottomNavigationBar(
          backgroundColor: Theme.of(
            context,
          ).bottomNavigationBarTheme.backgroundColor,
          type: BottomNavigationBarType.fixed,
          currentIndex: _currentIndex,
          selectedItemColor: AppTheme.primaryGold,
          unselectedItemColor: AppTheme.textMuted,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.directions_car_outlined),
              activeIcon: const Icon(Icons.directions_car),
              label: 'Rentals',
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.description_outlined),
              activeIcon: const Icon(Icons.description),
              label: 'Requests',
            ),
            BottomNavigationBarItem(
              icon: ValueListenableBuilder<int>(
                valueListenable: _apiService.unreadNotificationCount,
                builder: (context, count, _) => Badge(
                  label: Text(count.toString()),
                  isLabelVisible: count > 0,
                  child: const Icon(Icons.notifications_outlined),
                ),
              ),
              activeIcon: ValueListenableBuilder<int>(
                valueListenable: _apiService.unreadNotificationCount,
                builder: (context, count, _) => Badge(
                  label: Text(count.toString()),
                  isLabelVisible: count > 0,
                  child: const Icon(Icons.notifications),
                ),
              ),
              label: 'Alerts',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
