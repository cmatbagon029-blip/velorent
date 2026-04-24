import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:velorent_flutter/models/vehicle.dart';
import 'package:velorent_flutter/models/company.dart';
import 'package:velorent_flutter/models/notification.dart';
import 'package:velorent_flutter/models/company_policy.dart';
import 'package:velorent_flutter/models/chat.dart';

class ApiService {
  static const String baseUrl = 'https://velorent-backend.onrender.com/api';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Singleton pattern to ensure we use the same broadcast stream everywhere
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Stream for auth events (e.g., when token expires)
  static final _authEventController = StreamController<String>.broadcast();
  Stream<String> get authEventStream => _authEventController.stream;

  // Global unread chat message count
  final ValueNotifier<int> unreadChatCount = ValueNotifier<int>(0);
  
  // Global unread notification count
  final ValueNotifier<int> unreadNotificationCount = ValueNotifier<int>(0);

  Future<String?> getToken() async {
    return await _storage.read(key: 'token');
  }

  Future<bool> isGuest() async {
    final token = await getToken();
    return token == null;
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'token', value: token);
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    await _storage.write(key: 'user', value: json.encode(user));
  }

  Future<Map<String, dynamic>?> getUser() async {
    final userStr = await _storage.read(key: 'user');
    if (userStr != null) {
      return json.decode(userStr);
    }
    return null;
  }

  Future<void> clearAuth() async {
    await _storage.delete(key: 'token');
    await _storage.delete(key: 'user');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/login'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/plain, */*',
            },
            body: json.encode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 15));

      final data = json.decode(response.body);

      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          data['token'] != null) {
        await saveToken(data['token']);
        await saveUser(data['user']);
        return {'success': true, 'message': 'Login successful'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Login failed'};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error. Please check your internet connection.',
      };
    }
  }

  Future<Map<String, dynamic>> register(
    String email,
    String password,
    String name,
  ) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/register'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/plain, */*',
            },
            body: json.encode({
              'email': email,
              'password': password,
              'name': name,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final data = json.decode(response.body);

      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          data['success'] == true) {
        return {'success': true, 'message': 'Registration successful'};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error. Please check your internet connection.',
      };
    }
  }

  Future<List<Vehicle>> getVehicles() async {
    try {
      final response = await http
          .get(
            Uri.parse('$baseUrl/vehicles'),
            headers: {'Accept': 'application/json, text/plain, */*'},
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Vehicle.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching vehicles: $e');
    }
    return [];
  }

  Future<Vehicle?> getVehicleById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/vehicles/$id'),
        headers: {'Accept': 'application/json, text/plain, */*'},
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return Vehicle.fromJson(json.decode(response.body));
      }
    } catch (e) {
      debugPrint('Error fetching vehicle details: $e');
    }
    return null;
  }

  Future<List<RentalCompany>> getCompanies() async {
    try {
      final response = await http
          .get(
            Uri.parse('$baseUrl/companies'),
            headers: {'Accept': 'application/json, text/plain, */*'},
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => RentalCompany.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching companies: $e');
    }
    return [];
  }

  Future<RentalCompany?> getCompany(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/companies/$id'),
        headers: {'Accept': 'application/json, text/plain, */*'},
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return RentalCompany.fromJson(json.decode(response.body));
      }
    } catch (e) {
      debugPrint('Error fetching company details: $e');
    }
    return null;
  }
  // --- CHECKOUT & BOOKING FLOW APIs ---

  Future<Map<String, dynamic>> checkVehicleAvailability(
    int vehicleId,
    String rentFromDate,
    String rentToDate,
  ) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/rentals/check-availability'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json, text/plain, */*',
        },
        body: json.encode({
          'vehicleId': vehicleId,
          'rentFromDate': rentFromDate,
          'rentToDate': rentToDate,
        }),
      );

      return json.decode(response.body);
    } catch (e) {
      return {'isAvailable': false, 'message': 'Failed to check availability'};
    }
  }

  Future<Map<String, dynamic>> getCompanyRules(int companyId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/companies/$companyId/rules'),
        headers: {'Accept': 'application/json, text/plain, */*'},
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('Error fetching company rules: $e');
    }
    return {'rules': []};
  }

  Future<CompanyPolicy?> getCompanyPolicies(int companyId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/companies/$companyId/policies'),
        headers: {'Accept': 'application/json, text/plain, */*'},
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = json.decode(response.body);
        return CompanyPolicy.fromJson(data);
      }
    } catch (e) {
      debugPrint('Error fetching company policies: $e');
    }
    return null;
  }

  Future<Map<String, dynamic>> getCompanyAvailability(int companyId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/companies/$companyId/availability'),
        headers: {'Accept': 'application/json, text/plain, */*'},
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('Error fetching company availability: $e');
    }
    return {'availability': []};
  }

  Future<Map<String, dynamic>> createRentalWithFiles(
    Map<String, String> fields,
    List<http.MultipartFile> files,
  ) async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'message': 'Authentication token missing'};
      }

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/rentals'),
      );

      request.headers.addAll({
        'Authorization': 'Bearer $token',
        'Accept': 'application/json, text/plain, */*',
      });

      request.fields.addAll(fields);
      request.files.addAll(files);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      final data = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data;
      } else {
        throw Exception(data['message'] ?? data['error'] ?? 'Booking failed');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<List<dynamic>> getMyBookings() async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Authentication token missing');
    }
    final response = await http.get(
      Uri.parse('$baseUrl/rentals/my-bookings'),
      headers: {'Authorization': 'Bearer $token', 'Accept': 'application/json'},
    );

    if (response.statusCode == 401 || response.statusCode == 403) {
      _authEventController.add('unauthorized');
      throw Exception('Session expired');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final decoded = json.decode(response.body);
      return decoded is List ? decoded : [];
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to load bookings');
    }
  }

  Future<List<dynamic>> getMyRentals() async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Authentication token missing');
    }
    final response = await http.get(
      Uri.parse('$baseUrl/rentals/my-rentals'),
      headers: {'Authorization': 'Bearer $token', 'Accept': 'application/json'},
    );

    if (response.statusCode == 401 || response.statusCode == 403) {
      _authEventController.add('unauthorized');
      throw Exception('Session expired');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final decoded = json.decode(response.body);
      return decoded is List ? decoded : [];
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to load rentals');
    }
  }

  Future<Map<String, dynamic>> generateQRPH(
    double amount,
    int bookingId,
  ) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/payments/qrph'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json, text/plain, */*',
        },
        body: json.encode({'amount': amount, 'booking_id': bookingId}),
      );

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      final data = json.decode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data;
      } else {
        throw Exception(
          data['message'] ?? data['error'] ?? 'Payment generation failed',
        );
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>> getPaymentStatus(int bookingId) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/payments/status/$bookingId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json, text/plain, */*',
        },
      );

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        return {'status': 'error', 'message': 'Session expired'};
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      }
      return {'status': 'pending'};
    } catch (e) {
      debugPrint('Error fetching payment status: $e');
      return {'status': 'error', 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> getTransactionDetails(int bookingId) async {
    try {
      final token = await getToken();
      final response = await http
          .get(
            Uri.parse('$baseUrl/rentals/transaction/$bookingId'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      }
      throw Exception('Failed to get transaction details');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>> submitRequest({
    required int bookingId,
    required String requestType,
    String? reason,
    String? newStartDate,
    String? newEndDate,
    String? newRentTime,
  }) async {
    try {
      final token = await getToken();
      final body = <String, dynamic>{
        'booking_id': bookingId,
        'request_type': requestType,
        'reason': ?reason,
        'new_start_date': ?newStartDate,
        'new_end_date': ?newEndDate,
        'new_rent_time': ?newRentTime,
      };
      final response = await http
          .post(
            Uri.parse('$baseUrl/requests'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
            body: json.encode(body),
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }
      final data = json.decode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) return data;
      throw Exception(data['error'] ?? data['message'] ?? 'Request failed');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> deleteBooking(int bookingId) async {
    try {
      final token = await getToken();
      final response = await http
          .delete(
            Uri.parse('$baseUrl/bookings/$bookingId'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final data = json.decode(response.body);
        throw Exception(data['error'] ?? 'Failed to delete booking');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>> createPayment(
    double amount,
    int bookingId,
  ) async {
    try {
      final token = await getToken();
      final response = await http
          .post(
            Uri.parse('$baseUrl/payments/qrph'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
            body: json.encode({'amount': amount, 'booking_id': bookingId}),
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }
      final data = json.decode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) return data;
      throw Exception(data['error'] ?? data['message'] ?? 'Payment failed');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<List<UserNotification>> getNotifications() async {
    try {
      final token = await getToken();
      final response = await http
          .get(
            Uri.parse('$baseUrl/notifications/my-notifications'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> decoded = json.decode(response.body);
        return decoded.map((json) => UserNotification.fromJson(json)).toList();
      }
      throw Exception('Failed to fetch notifications');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> markNotificationAsRead(int notificationId) async {
    try {
      final token = await getToken();
      final response = await http
          .put(
            Uri.parse('$baseUrl/notifications/$notificationId/read'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final data = json.decode(response.body);
        throw Exception(data['error'] ?? 'Failed to mark notification as read');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> markAllNotificationsAsRead() async {
    try {
      final token = await getToken();
      final response = await http
          .put(
            Uri.parse('$baseUrl/notifications/mark-all-read'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> deleteNotification(int notificationId) async {
    try {
      final token = await getToken();
      final response = await http
          .delete(
            Uri.parse('$baseUrl/notifications/$notificationId'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final data = json.decode(response.body);
        throw Exception(data['error'] ?? 'Failed to delete notification');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> clearAllNotifications() async {
    try {
      final token = await getToken();
      final response = await http
          .delete(
            Uri.parse('$baseUrl/notifications/clear-all'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final data = json.decode(response.body);
        throw Exception(data['error'] ?? 'Failed to clear notifications');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<int> getUnreadNotificationCount() async {
    try {
      final token = await getToken();
      final response = await http
          .get(
            Uri.parse('$baseUrl/notifications/unread-count'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['count'] ?? 0;
      }
      return 0;
    } catch (e) {
      debugPrint('Error fetching unread count: $e');
      return 0;
    }
  }

  Future<List<dynamic>> getMyRequests() async {
    try {
      final token = await getToken();
      final response = await http
          .get(
            Uri.parse('$baseUrl/requests/my-requests'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = json.decode(response.body);
        return decoded is List ? decoded : [];
      }
      throw Exception('Failed to fetch requests');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> deleteRequest(int requestId) async {
    try {
      final token = await getToken();
      final response = await http
          .delete(
            Uri.parse('$baseUrl/requests/$requestId'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final data = json.decode(response.body);
        throw Exception(data['error'] ?? 'Failed to delete request');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<List<ChatRoom>> getChatRooms() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/chat/conversations'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final rooms = data.map((json) => ChatRoom.fromJson(json)).toList();
        
        // Update global unread count
        final totalUnread = rooms.fold(0, (sum, room) => sum + room.unreadCount);
        unreadChatCount.value = totalUnread;
        
        return rooms;
      }
      throw Exception('Failed to fetch chats');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> refreshUnreadCount() async {
    try {
      final isGuestVal = await isGuest();
      if (isGuestVal) {
        unreadChatCount.value = 0;
        unreadNotificationCount.value = 0;
        return;
      }
      await getChatRooms(); // This updates the chat notifier
      
      final notifCount = await getUnreadNotificationCount();
      unreadNotificationCount.value = notifCount;
    } catch (e) {
      debugPrint('Error refreshing global unread counts: $e');
    }
  }

  Future<List<ChatMessage>> getChatMessages(int conversationId) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/chat/messages/$conversationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => ChatMessage.fromJson(json)).toList();
      }
      throw Exception('Failed to fetch messages');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<ChatMessage> sendChatMessage(int conversationId, String message) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/chat/send'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
        body: json.encode({
          'conversation_id': conversationId,
          'message': message,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 201) {
        return ChatMessage.fromJson(json.decode(response.body));
      }
      throw Exception('Failed to send message');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<ChatRoom> startConversation(int companyId, int? vehicleId) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/chat/start'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
        body: json.encode({
          'company_id': companyId,
          'vehicle_id': vehicleId,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return ChatRoom.fromJson(json.decode(response.body));
      }
      throw Exception('Failed to start conversation');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> deleteChatMessage(int messageId, {String deleteType = 'me'}) async {
    try {
      final token = await getToken();
      final response = await http.delete(
        Uri.parse('$baseUrl/chat/messages/$messageId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
        body: json.encode({'delete_type': deleteType}),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final data = json.decode(response.body);
        throw Exception(data['error'] ?? 'Failed to delete message');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> deleteConversation(int conversationId, {String deleteType = 'me'}) async {
    try {
      final token = await getToken();
      final response = await http.delete(
        Uri.parse('$baseUrl/chat/conversations/$conversationId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
        body: json.encode({'delete_type': deleteType}),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final data = json.decode(response.body);
        throw Exception(data['error'] ?? 'Failed to delete conversation');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> submitReview({
    required int bookingId,
    required int rating,
    String? comment,
  }) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/reviews'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
        body: json.encode({
          'booking_id': bookingId,
          'rating': rating,
          'comment': comment,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final data = json.decode(response.body);
        throw Exception(data['error'] ?? data['message'] ?? 'Failed to submit review');
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>?> getReviewForBooking(int bookingId) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/reviews/booking/$bookingId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 401 || response.statusCode == 403) {
        _authEventController.add('unauthorized');
        throw Exception('Session expired');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching review: $e');
      return null;
    }
  }

  Future<List<dynamic>> getVehicleReviews(int vehicleId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/reviews/vehicle/$vehicleId'),
        headers: {
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching vehicle reviews: $e');
      return [];
    }
  }

  Future<List<dynamic>> getCompanyReviews(int companyId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/reviews/company/$companyId'),
        headers: {
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching company reviews: $e');
      return [];
    }
  }
}
