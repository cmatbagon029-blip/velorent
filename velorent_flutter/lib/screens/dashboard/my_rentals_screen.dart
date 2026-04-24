import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:velorent_flutter/theme/app_theme.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:velorent_flutter/widgets/pressable_scale.dart';
import 'package:velorent_flutter/widgets/velo_loading.dart';
import 'package:velorent_flutter/services/api_service.dart';
import 'package:velorent_flutter/widgets/guest_placeholder.dart';
import 'package:velorent_flutter/widgets/company_policy_info.dart';
import 'package:intl/intl.dart';

class MyRentalsScreen extends StatefulWidget {
  const MyRentalsScreen({super.key});

  @override
  State<MyRentalsScreen> createState() => _MyRentalsScreenState();
}

class _MyRentalsScreenState extends State<MyRentalsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _isGuest = false;
  String _error = '';
  List<dynamic> _bookings = [];

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
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

      final bookings = await _apiService.getMyBookings();
      if (mounted) {
        setState(() {
          _isGuest = false;
          _bookings = bookings;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      return DateFormat('MMM d, yyyy').format(DateTime.parse(dateStr));
    } catch (_) {
      return dateStr;
    }
  }

  String _formatTime(String? timeStr) {
    if (timeStr == null) return '';
    try {
      final parts = timeStr.split(':');
      final dt = DateTime(0, 0, 0, int.parse(parts[0]), int.parse(parts[1]));
      return DateFormat('h:mm a').format(dt);
    } catch (_) {
      return timeStr;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'active':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
      case 'rejected':
      case 'failed':
        return Colors.red;
      case 'completed':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  bool _needsPayment(dynamic booking) {
    final status = booking['status']?.toString() ?? '';
    if (status == 'Cancelled' || status == 'Rejected' || status == 'Completed') {
      return false;
    }
    final paymentStatus = booking['payment_status']?.toString().toLowerCase();
    return paymentStatus == 'pending' ||
        paymentStatus == 'failed' ||
        paymentStatus == null;
  }

  bool _canRequestAction(dynamic booking) {
    final status = booking['status']?.toString() ?? '';
    return status == 'Pending' || status == 'Approved';
  }

  // ─── COMPLETE PAYMENT ──────────────────────────────────────────────────────────
  Future<void> _completePayment(dynamic booking) async {
    final bookingId = booking['id'];
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: VeloLoading()),
    );

    try {
      final txDetails = await _apiService.getTransactionDetails(bookingId);
      if (!mounted) return;
      Navigator.of(context).pop(); // close loader

      double remainingAmount = 0;
      if (txDetails['payment_summary'] != null) {
        remainingAmount =
            double.tryParse(
              txDetails['payment_summary']['remaining_amount']?.toString() ??
                  '0',
            ) ??
            0;
      }
      if (remainingAmount <= 0) {
        final totalCost =
            double.tryParse(txDetails['total_price']?.toString() ?? '0') ?? 0;
        final payments = txDetails['payments'] as List<dynamic>? ?? [];
        final totalPaid = payments
            .where((p) => p['status'] == 'paid')
            .fold<double>(
              0,
              (sum, p) =>
                  sum + (double.tryParse(p['amount']?.toString() ?? '0') ?? 0),
            );
        remainingAmount = totalCost - totalPaid;
      }

      final paymentStatus = txDetails['payment_status']?.toString();
      if (paymentStatus == 'paid' && remainingAmount <= 0) {
        if (!mounted) return;
        _showInfoDialog(
          'Payment Not Needed',
          'This booking is already fully paid.',
        );
        return;
      }

      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: Theme.of(context).cardTheme.color,
          title: Text(
            'Complete Payment',
            style: TextStyle(color: Theme.of(context).primaryColor),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Complete payment of ₱${remainingAmount.toStringAsFixed(2)} for Booking #$bookingId?',
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _initiatePayment(bookingId, remainingAmount);
                  },
                  child: const Text('Proceed to Payment', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.grey,
                    side: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop();
        _showInfoDialog(
          'Error',
          'Unable to fetch payment details. Please try again.',
        );
      }
    }
  }

  Future<void> _initiatePayment(int bookingId, double amount) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: VeloLoading()),
    );

    try {
      final paymentResponse = await _apiService.createPayment(
        amount,
        bookingId,
      );
      if (!mounted) return;
      Navigator.of(context).pop();

      final qrUrl =
          paymentResponse['qr_image_url']?.toString() ??
          paymentResponse['qrUrl']?.toString();
      if (qrUrl == null || qrUrl.isEmpty) {
        _showInfoDialog('Error', 'QR code not received. Please try again.');
        return;
      }
      _showQrPaymentDialog(bookingId, amount, qrUrl);
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop();
      _showInfoDialog(
        'Payment Error',
        e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  void _showQrPaymentDialog(int bookingId, double amount, String qrUrl) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        backgroundColor: Theme.of(context).cardTheme.color,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.qr_code_scanner,
                color: Theme.of(context).primaryColor,
                size: 48,
              ),
              const SizedBox(height: 12),
              Text(
                'Complete Payment via QR Ph',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Amount: ₱${amount.toStringAsFixed(2)}',
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: SizedBox(
                  height: 220,
                  width: 220,
                  child: qrUrl.startsWith('data:image')
                      ? Image.memory(
                          base64Decode(qrUrl.split(',').last),
                          fit: BoxFit.contain,
                        )
                      : Image.network(
                          qrUrl,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => const Center(
                            child: Icon(
                              Icons.broken_image,
                              color: Colors.grey,
                              size: 48,
                            ),
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Open GCash, Maya, or your bank app to scan',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey.shade800,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _loadBookings();
                  },
                  child: const Text('Close & Check Status'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── RESCHEDULE REQUEST ────────────────────────────────────────────────────────
  Future<void> _openRescheduleRequest(dynamic booking) async {
    DateTime? newStart;
    DateTime? newEnd;
    TimeOfDay? newTime;
    final reasonCtrl = TextEditingController();

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setStateDialog) => AlertDialog(
          backgroundColor: Theme.of(context).cardTheme.color,
          title: Text(
            'Request Reschedule',
            style: TextStyle(color: Theme.of(context).primaryColor),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CompanyPolicyInfo(
                  companyId: booking['company_id'],
                  showOnly: 'reschedule',
                ),
                const SizedBox(height: 16),
                const Text(
                  'Select your preferred new dates:',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).primaryColor,
                    side: BorderSide(
                      color: Theme.of(context).dividerColor.withValues(alpha: 0.3),
                    ),
                  ),
                  icon: const Icon(Icons.calendar_today_outlined, size: 16),
                  label: Text(
                    newStart == null
                        ? 'New Start Date'
                        : DateFormat('MMM d, yyyy').format(newStart!),
                  ),
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: ctx,
                      initialDate: DateTime.now().add(const Duration(days: 1)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) setStateDialog(() => newStart = date);
                  },
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).primaryColor,
                    side: BorderSide(
                      color: Theme.of(context).dividerColor.withValues(alpha: 0.3),
                    ),
                  ),
                  icon: const Icon(Icons.calendar_today_outlined, size: 16),
                  label: Text(
                    newEnd == null
                        ? 'New End Date'
                        : DateFormat('MMM d, yyyy').format(newEnd!),
                  ),
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: ctx,
                      initialDate: (newStart ?? DateTime.now()).add(
                        const Duration(days: 1),
                      ),
                      firstDate: newStart ?? DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) setStateDialog(() => newEnd = date);
                  },
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).primaryColor,
                    side: BorderSide(
                      color: Theme.of(context).dividerColor.withValues(alpha: 0.3),
                    ),
                  ),
                  icon: const Icon(Icons.access_time, size: 16),
                  label: Text(
                    newTime == null
                        ? 'New Pick-up Time (optional)'
                        : newTime!.format(ctx),
                  ),
                  onPressed: () async {
                    final t = await showTimePicker(
                      context: ctx,
                      initialTime: TimeOfDay.now(),
                    );
                    if (t != null) setStateDialog(() => newTime = t);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: reasonCtrl,
                  maxLines: 3,
                  style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                  onChanged: (_) => setStateDialog(
                    () {},
                  ), // rebuild to re-evaluate button state
                  decoration: InputDecoration(
                    hintText: 'Reason for rescheduling (required)',
                    hintStyle: TextStyle(color: Theme.of(context).hintColor),
                    filled: true,
                    fillColor: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF1E1E1E)
                        : Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // ─── ACTION BUTTONS ──────────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed:
                        newStart == null ||
                            newEnd == null ||
                            reasonCtrl.text.trim().isEmpty
                        ? null
                        : () async {
                            Navigator.pop(ctx);
                            await _submitRequest(
                              booking['id'],
                              'reschedule',
                              reason: reasonCtrl.text.trim(),
                              newStartDate: DateFormat(
                                'yyyy-MM-dd',
                              ).format(newStart!),
                              newEndDate: DateFormat('yyyy-MM-dd').format(newEnd!),
                              newRentTime: newTime != null
                                  ? '${newTime!.hour.toString().padLeft(2, '0')}:${newTime!.minute.toString().padLeft(2, '0')}'
                                  : null,
                            );
                          },
                    child: const Text('Submit Reschedule Request', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.grey,
                      side: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─── CANCELLATION REQUEST ──────────────────────────────────────────────────────
  Future<void> _openCancellationRequest(dynamic booking) async {
    final reasonCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setStateDialog) => AlertDialog(
          backgroundColor: Theme.of(context).cardTheme.color,
          title: const Text(
            'Request Cancellation',
            style: TextStyle(color: Colors.redAccent),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CompanyPolicyInfo(
                  companyId: booking['company_id'],
                  showOnly: 'cancellation',
                ),
                const SizedBox(height: 16),
                const Text(
                  'Please provide a reason for cancellation:',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: reasonCtrl,
                  maxLines: 3,
                  style: TextStyle(
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                  onChanged: (_) => setStateDialog(() {}),
                  decoration: InputDecoration(
                    hintText: 'Your reason...',
                    hintStyle: TextStyle(color: Theme.of(context).hintColor),
                    filled: true,
                    fillColor: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF1E1E1E)
                        : Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Note: Cancellation fees may apply depending on company policy.',
                  style: TextStyle(color: Colors.orange, fontSize: 11),
                ),
                const SizedBox(height: 24),
                // ─── ACTION BUTTONS ──────────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: reasonCtrl.text.trim().isEmpty
                        ? null
                        : () async {
                            Navigator.pop(ctx);
                            await _submitRequest(
                              booking['id'],
                              'cancellation',
                              reason: reasonCtrl.text,
                            );
                          },
                    child: const Text('Cancel Booking', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.grey,
                      side: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Go Back'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submitRequest(
    int bookingId,
    String requestType, {
    String? reason,
    String? newStartDate,
    String? newEndDate,
    String? newRentTime,
  }) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: VeloLoading()),
    );
    try {
      await _apiService.submitRequest(
        bookingId: bookingId,
        requestType: requestType,
        reason: reason,
        newStartDate: newStartDate,
        newEndDate: newEndDate,
        newRentTime: newRentTime,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      _loadBookings();
      _showInfoDialog(
        requestType == 'reschedule'
            ? 'Reschedule Requested'
            : 'Cancellation Requested',
        'Your request has been submitted and is pending approval from the company.',
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop();
      _showInfoDialog(
        'Request Failed',
        e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  // ─── DELETE CANCELLED BOOKING ──────────────────────────────────────────────────
  Future<void> _deleteBooking(dynamic booking) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(context).cardTheme.color,
        title: const Text(
          'Delete Booking',
          style: TextStyle(color: Colors.redAccent),
        ),
        content: const Text(
          'Permanently delete this cancelled booking? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: VeloLoading()),
    );

    try {
      await _apiService.deleteBooking(booking['id']);
      if (!mounted) return;
      Navigator.of(context).pop();
      _loadBookings();
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop();
      _showInfoDialog('Error', e.toString().replaceFirst('Exception: ', ''));
    }
  }

  // ─── TRANSACTION DETAILS ───────────────────────────────────────────────────────
  Future<void> _viewTransactionDetails(dynamic booking) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: VeloLoading()),
    );

    try {
      final txDetails = await _apiService.getTransactionDetails(booking['id']);
      if (!mounted) return;
      Navigator.of(context).pop();
      _showTransactionDetailsDialog(booking, txDetails);
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop();
      // Fallback: show basic booking info from what we have
      _showBasicDetailsDialog(booking);
    }
  }

  void _showTransactionDetailsDialog(
    dynamic booking,
    Map<String, dynamic> txDetails,
  ) {
    final paymentSummary = txDetails['payment_summary'];
    final payments = txDetails['payments'] as List<dynamic>? ?? [];

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Theme.of(context).cardTheme.color,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.receipt_long, color: Theme.of(context).primaryColor),
                    const SizedBox(width: 8),
                    Text(
                      'Transaction Details',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.grey),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(color: Colors.grey),
                _txRow('Booking #', '${booking['id']}'),
                _txRow('Vehicle', booking['vehicle_name']?.toString() ?? 'N/A'),
                _txRow('Company', booking['company_name']?.toString() ?? 'N/A'),
                _txRow(
                  'Dates',
                  '${_formatDate(booking['start_date'])} – ${_formatDate(booking['end_date'])}',
                ),
                if (booking['rent_time'] != null)
                  _txRow('Time', _formatTime(booking['rent_time']?.toString())),
                Builder(
                  builder: (context) {
                    String service = booking['service_type']?.toString() ?? '';
                    if (service.isEmpty || service == 'with_driver') {
                      service = 'With Driver';
                    } else if (service == 'without_driver') {
                      service = 'Self Drive';
                    }
                    return _txRow('Service', service);
                  }
                ),
                Builder(
                  builder: (context) {
                    String status = booking['status']?.toString() ?? 'N/A';
                    if (status == 'Rented') status = 'Approved';
                    return _txRow('Status', status);
                  }
                ),
                const Divider(color: Colors.grey),
                Text(
                  'Payment Summary',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                if (paymentSummary != null) ...[
                  _txRow(
                    'Total Cost',
                    '₱${double.tryParse(paymentSummary['total_cost']?.toString() ?? '0')?.toStringAsFixed(2) ?? '0.00'}',
                  ),
                  _txRow(
                    'Total Paid',
                    '₱${double.tryParse(paymentSummary['total_paid']?.toString() ?? '0')?.toStringAsFixed(2) ?? '0.00'}',
                  ),
                  _txRow(
                    'Remaining',
                    '₱${double.tryParse(paymentSummary['remaining_amount']?.toString() ?? '0')?.toStringAsFixed(2) ?? '0.00'}',
                  ),
                  _txRow(
                    'Payment Status',
                    (booking['payment_status'] ?? 'N/A')
                        .toString()
                        .toUpperCase(),
                  ),
                ],
                if (payments.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Payments',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryGold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...payments
                      .map(
                        (p) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color:
                                Theme.of(context).brightness == Brightness.dark
                                ? const Color(0xFF1E1E1E)
                                : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: Theme.of(context).dividerColor,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '₱${double.tryParse(p['amount']?.toString() ?? '0')?.toStringAsFixed(2) ?? '0.00'}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: _payStatusColor(
                                    p['status']?.toString(),
                                  ).withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: _payStatusColor(
                                      p['status']?.toString(),
                                    ),
                                  ),
                                ),
                                child: Text(
                                  (p['status'] ?? '').toString().toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: _payStatusColor(
                                      p['status']?.toString(),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                      ,
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGold,
                      foregroundColor: Colors.black,
                    ),
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showBasicDetailsDialog(dynamic booking) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Theme.of(context).cardTheme.color,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.receipt_long, color: AppTheme.primaryGold),
                  const SizedBox(width: 8),
                  const Text(
                    'Booking Details',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryGold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(color: Colors.grey),
              _txRow('Booking #', '${booking['id']}'),
              _txRow('Vehicle', booking['vehicle_name']?.toString() ?? 'N/A'),
              _txRow('Company', booking['company_name']?.toString() ?? 'N/A'),
              _txRow(
                'Dates',
                '${_formatDate(booking['start_date'])} – ${_formatDate(booking['end_date'])}',
              ),
              _txRow('Status', booking['status']?.toString() ?? 'N/A'),
              _txRow('Payment', booking['payment_status']?.toString() ?? 'N/A'),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGold,
                    foregroundColor: Colors.black,
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _payStatusColor(String? status) {
    switch (status?.toLowerCase() ?? '') {
      case 'paid':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _txRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }

  void _showInfoDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(context).cardTheme.color,
        title: Text(title, style: const TextStyle(color: AppTheme.primaryGold)),
        content: Text(
          message,
          style: TextStyle(
            color: Theme.of(context).textTheme.bodyMedium?.color,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'OK',
              style: TextStyle(color: AppTheme.primaryGold),
            ),
          ),
        ],
      ),
    );
  }

  void _showSuccess(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _openFeedbackDialog(dynamic booking) {
    int rating = 5;
    final commentController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => Container(
          padding: EdgeInsets.fromLTRB(16, 20, 16, MediaQuery.of(context).viewInsets.bottom + 20),
          decoration: BoxDecoration(
            color: Theme.of(context).cardTheme.color,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Rate your Experience', 
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryGold)),
              const SizedBox(height: 10),
              const Text('How was your booking experience?', 
                style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: AppTheme.primaryGold,
                      size: 40,
                    ),
                    onPressed: () => setState(() => rating = index + 1),
                  );
                }),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: commentController,
                maxLines: 3,
                style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color),
                decoration: InputDecoration(
                  hintText: 'Tell us more about your experience (optional)',
                  hintStyle: const TextStyle(color: Colors.grey),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Colors.grey),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isSubmitting ? null : () async {
                    setState(() => isSubmitting = true);
                    try {
                      await _apiService.submitReview(
                        bookingId: int.parse(booking['id'].toString()),
                        rating: rating,
                        comment: commentController.text.trim(),
                      );
                      if (mounted) {
                        Navigator.pop(ctx);
                        _showSuccess('Thank you for your feedback!');
                        _loadBookings();
                      }
                    } catch (e) {
                      if (mounted) {
                        setState(() => isSubmitting = false);
                        _showError(e.toString());
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isSubmitting 
                    ? const SizedBox(height: 20, width: 20, 
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black)) 
                    : const Text('Submit Feedback'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Rentals'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadBookings),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadBookings,
        color: AppTheme.primaryGold,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: VeloLoading());
    if (_isGuest) {
      return const GuestPlaceholder(
        title: 'Rentals Unavailable',
        message: 'Please sign in to view and manage your rentals.',
        icon: Icons.directions_car_outlined,
      );
    }
    if (_error.isNotEmpty) return _buildErrorState();
    if (_bookings.isEmpty) return _buildEmptyState();

    final cancelledCount = _bookings
        .where((b) => b['status']?.toString() == 'Cancelled')
        .length;

    return Column(
      children: [
        if (cancelledCount > 0)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline,
                    color: Colors.redAccent,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'You have $cancelledCount cancelled booking(s). You can delete them.',
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        Expanded(
          child: AnimationLimiter(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _bookings.length,
              itemBuilder: (context, index) {
                return AnimationConfiguration.staggeredList(
                  position: index,
                  duration: const Duration(milliseconds: 375),
                  child: SlideAnimation(
                    verticalOffset: 50.0,
                    child: FadeInAnimation(
                      child: _buildBookingCard(_bookings[index]),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.redAccent),
            const SizedBox(height: 16),
            Text(
              _error,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadBookings,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGold,
                foregroundColor: Colors.black,
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.directions_car, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'No Bookings Yet',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "You haven't booked any vehicles yet.",
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/dashboard'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGold,
              foregroundColor: Colors.black,
            ),
            child: const Text('Browse Vehicles'),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingCard(dynamic booking) {
    String status = booking['status']?.toString() ?? 'Unknown';
    if (status == 'Rented') status = 'Approved';
    final vehicleName = booking['vehicle_name']?.toString() ?? 'Vehicle';
    final isCancelled = status == 'Cancelled' || status == 'Rejected' || status == 'Disapproved';
    final canDelete = isCancelled || status == 'Approved' || status == 'Rented' || status == 'Completed';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isCancelled
              ? Colors.red
              : Theme.of(context).dividerColor.withValues(alpha: 0.2),
          width: isCancelled ? 0.5 : 1.0,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    vehicleName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryGold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _getStatusColor(status)),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 4),
            if (booking['company_name'] != null)
              Text(
                booking['company_name']?.toString() ?? '',
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),

            const Divider(color: Colors.grey, height: 20),

            _detailRow(
              'Dates',
              '${_formatDate(booking['start_date'])} – ${_formatDate(booking['end_date'])}',
            ),
            if (booking['rent_time'] != null)
              _detailRow('Time', _formatTime(booking['rent_time']?.toString())),
            if (booking['destination'] != null &&
                (booking['destination']?.toString() ?? '').isNotEmpty)
              _detailRow(
                'Destination',
                booking['destination']?.toString() ?? '',
              ),
            Builder(
              builder: (context) {
                String service = booking['service_type']?.toString() ?? '';
                if (service.isEmpty || service == 'with_driver') {
                  service = 'With Driver';
                } else if (service == 'without_driver') {
                  service = 'Self Drive';
                }
                return _detailRow('Service', service);
              }
            ),
            _detailRow(
              'Payment',
              (booking['payment_status'] ?? 'Pending').toString().toUpperCase(),
            ),

            const SizedBox(height: 14),

            // ─── ACTION BUTTONS ────────────────────────────────────────────────
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                // Complete Payment button (only when payment is needed)
                if (_needsPayment(booking))
                  PressableScale(
                    onTap: () => _completePayment(booking),
                    child: ElevatedButton.icon(
                      onPressed: () => _completePayment(booking),
                      icon: const Icon(Icons.payment, size: 15),
                      label: const Text(
                        'Complete Payment',
                        style: TextStyle(fontSize: 12),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        minimumSize: Size.zero,
                      ),
                    ),
                  ),

                // Transaction Details
                PressableScale(
                  onTap: () => _viewTransactionDetails(booking),
                  child: OutlinedButton.icon(
                    onPressed: () => _viewTransactionDetails(booking),
                    icon: Icon(
                      Icons.receipt_long,
                      size: 15,
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                    ),
                    label: Text(
                      'Transaction Details',
                      style: TextStyle(
                        color: Theme.of(context).textTheme.bodyMedium?.color,
                        fontSize: 12,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.grey),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      minimumSize: Size.zero,
                    ),
                  ),
                ),

                // Reschedule Request
                if (_canRequestAction(booking) && (booking['allow_reschedule'] == null || booking['allow_reschedule'] == 1 || booking['allow_reschedule'] == true))
                  OutlinedButton.icon(
                    onPressed: () => _openRescheduleRequest(booking),
                    icon: const Icon(
                      Icons.calendar_today_outlined,
                      size: 15,
                      color: Colors.lightBlue,
                    ),
                    label: const Text(
                      'Reschedule',
                      style: TextStyle(color: Colors.lightBlue, fontSize: 12),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.lightBlue),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      minimumSize: Size.zero,
                    ),
                  ),

                // Feedback
                if (status == 'Approved' || status == 'Completed' || status == 'Success' || status == 'Active' || status == 'Rented')
                  OutlinedButton.icon(
                    onPressed: () => _openFeedbackDialog(booking),
                    icon: const Icon(
                      Icons.rate_review_outlined,
                      size: 15,
                      color: AppTheme.primaryGold,
                    ),
                    label: const Text(
                      'Feedback',
                      style: TextStyle(color: AppTheme.primaryGold, fontSize: 12),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.primaryGold),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      minimumSize: Size.zero,
                    ),
                  ),

                // Cancellation Request
                if (_canRequestAction(booking) && (booking['allow_cancellation'] == null || booking['allow_cancellation'] == 1 || booking['allow_cancellation'] == true))
                  OutlinedButton.icon(
                    onPressed: () => _openCancellationRequest(booking),
                    icon: const Icon(
                      Icons.cancel_outlined,
                      size: 15,
                      color: Colors.redAccent,
                    ),
                    label: const Text(
                      'Cancel',
                      style: TextStyle(color: Colors.redAccent, fontSize: 12),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.redAccent),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      minimumSize: Size.zero,
                    ),
                  ),

                // Delete Cancelled/Completed/Rented Booking
                if (canDelete)
                  OutlinedButton.icon(
                    onPressed: () => _deleteBooking(booking),
                    icon: const Icon(
                      Icons.delete_outline,
                      size: 15,
                      color: Colors.redAccent,
                    ),
                    label: const Text(
                      'Delete',
                      style: TextStyle(color: Colors.redAccent, fontSize: 12),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.redAccent),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      minimumSize: Size.zero,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 86,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
