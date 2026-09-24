import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/device_image_picker.dart';
import '../../widgets/user_avatar_widget.dart';

import '../settings/waiter_settings_screen.dart';

class WaiterProfileScreen extends StatelessWidget {
  const WaiterProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    final phone = user?.phone ?? '';
    final empId = user?.empId ?? '';
    final userId = user?.id ?? '';
    final branch = user?.branch ?? '';
    final dept = user?.department ?? '';
    final shift = user?.scheduledShift ?? '';
    final status = user?.status ?? '';
    final attendance = user?.attendanceStatus ?? '';
    final assigned = user?.assignedTables ?? [];

    final nameStr = user?.name ?? 'Waiter Staff';
    final phoneStr = phone.isNotEmpty ? phone : 'Not Specified';
    final empIdStr = empId.isNotEmpty ? empId : (userId.length >= 4 ? 'RMSW-${userId.substring(userId.length - 4).toUpperCase()}' : 'RMSW-01');
    final branchStr = branch.isNotEmpty ? branch : 'Main Branch';
    final deptStr = dept.isNotEmpty ? dept : 'Floor Operations';
    final shiftStr = shift.isNotEmpty ? shift : 'General Shift';
    final statusStr = status.isNotEmpty ? status : 'Active';
    final attendanceStr = attendance.isNotEmpty ? attendance : 'Present';
    final hoursStr = user?.calculatedShiftHours ?? _calculateShiftHours(shiftStr, user?.hoursLogged);
    final tablesStr = assigned.isNotEmpty ? assigned.join(', ') : 'All Floor Tables (Auto-Sync)';

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit Profile Details',
            onPressed: () => _showEditProfileModal(context, authProvider),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            tooltip: 'Shift Actions Dropdown',
            onSelected: (val) async {
              if (val == 'checkin') {
                final success = await authProvider.checkIn();
                if (context.mounted && success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('✓ Checked In for Shift successfully'), backgroundColor: AppColors.darkGreen),
                  );
                }
              } else if (val == 'checkout') {
                final success = await authProvider.checkOut();
                if (context.mounted && success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('✓ Checked Out of Shift successfully'), backgroundColor: Colors.amber),
                  );
                }
              } else if (val == 'settings') {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const WaiterSettingsScreen()));
              }
            },
            itemBuilder: (ctx) {
              final isCheckedIn = user?.isCheckedIn ?? true;
              return [
                PopupMenuItem(
                  value: isCheckedIn ? 'checkout' : 'checkin',
                  child: Row(
                    children: [
                      Icon(
                        isCheckedIn ? Icons.timer_off_outlined : Icons.timer_outlined,
                        color: isCheckedIn ? Colors.amber.shade900 : AppColors.darkGreen,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        isCheckedIn ? 'Check Out of Shift' : 'Check In to Shift',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isCheckedIn ? Colors.amber.shade900 : AppColors.darkGreen,
                        ),
                      ),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'settings',
                  child: Row(
                    children: [
                      Icon(Icons.settings_outlined, size: 20, color: AppColors.textPrimary),
                      SizedBox(width: 10),
                      Text('App Settings'),
                    ],
                  ),
                ),
              ];
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Header Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Interactive Avatar with Camera Badge
                    GestureDetector(
                      onTap: () => _pickAndUploadPhoto(context, authProvider),
                      child: Stack(
                        alignment: Alignment.bottomRight,
                  children: [
                    UserAvatarWidget(
                      avatarUrl: user?.avatarUrl,
                      name: nameStr,
                      radius: 44,
                      border: Border.all(color: AppColors.darkGreen, width: 2.5),
                          ),
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: AppColors.darkGreen,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.camera_alt,
                              size: 16,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      nameStr,
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? '',
                      style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Emp ID Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'EMP ID: $empIdStr',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Role Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppColors.lightGreen,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.availableBorder),
                          ),
                          child: Text(
                            'ROLE: ${user?.role.toUpperCase() ?? "WAITER"}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.accentGreen),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),


            // Duty & Shift Information Card
            Card(
              elevation: 1.5,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.badge_outlined, color: AppColors.darkGreen, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Duty & Shift Status',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatusStat('Account Status', statusStr, Icons.verified_user, Colors.green),
                        _buildStatusStat('Attendance', attendanceStr, Icons.check_circle_outline, const Color(0xFF10B981)),
                        _buildStatusStat('Hours Logged', hoursStr, Icons.access_time_rounded, Colors.orange),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Profile Details Card
            Card(
              elevation: 1.5,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  _buildProfileTile(
                    Icons.phone_outlined,
                    'Contact Number',
                    phoneStr,
                    onTap: () => _showEditProfileModal(context, authProvider),
                  ),
                  const Divider(height: 1),
                  _buildProfileTile(Icons.storefront_outlined, 'Branch / Restaurant', branchStr),
                  const Divider(height: 1),
                  _buildProfileTile(Icons.corporate_fare_outlined, 'Department', deptStr),
                  const Divider(height: 1),
                  _buildProfileTile(Icons.schedule_outlined, 'Scheduled Shift', shiftStr),
                  const Divider(height: 1),
                  _buildProfileTile(Icons.table_restaurant_outlined, 'Assigned Floor Section', tablesStr),
                ],
              ),
            ),
            const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusStat(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  String _calculateShiftHours(String shiftStr, String? fallbackHours) {
    if (shiftStr.trim().isEmpty) {
      return (fallbackHours != null && fallbackHours.isNotEmpty) ? fallbackHours : '9h 00m';
    }

    final regExp = RegExp(r'(\d{1,2}):(\d{2})\s*(AM|PM)', caseSensitive: false);
    final matches = regExp.allMatches(shiftStr).toList();
    if (matches.length >= 2) {
      try {
        final m1 = matches[0];
        final m2 = matches[1];

        int h1 = int.parse(m1.group(1)!);
        int min1 = int.parse(m1.group(2)!);
        String p1 = m1.group(3)!.toUpperCase();

        int h2 = int.parse(m2.group(1)!);
        int min2 = int.parse(m2.group(2)!);
        String p2 = m2.group(3)!.toUpperCase();

        if (p1 == 'PM' && h1 < 12) h1 += 12;
        if (p1 == 'AM' && h1 == 12) h1 = 0;

        if (p2 == 'PM' && h2 < 12) h2 += 12;
        if (p2 == 'AM' && h2 == 12) h2 = 0;

        int startTotal = h1 * 60 + min1;
        int endTotal = h2 * 60 + min2;

        if (endTotal < startTotal) {
          endTotal += 24 * 60; // Overnight shift
        }

        int diffMins = endTotal - startTotal;
        int hours = diffMins ~/ 60;
        int mins = diffMins % 60;

        if (mins > 0) {
          return '${hours}h ${mins.toString().padLeft(2, '0')}m';
        } else {
          return '${hours}h 00m';
        }
      } catch (_) {}
    }

    return (fallbackHours != null && fallbackHours.isNotEmpty) ? fallbackHours : '9h 00m';
  }

  Widget _buildProfileTile(
    IconData icon,
    String title,
    String subtitle, {
    bool isEditable = false,
    VoidCallback? onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: AppColors.darkGreen),
      title: Text(
        title,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
      ),
      trailing: isEditable ? const Icon(Icons.edit_outlined, size: 18, color: AppColors.darkGreen) : null,
    );
  }

  void _showEditProfileModal(BuildContext context, AuthProvider authProvider) {
    final user = authProvider.user;
    final nameCtrl = TextEditingController(text: user?.name ?? '');
    final phoneCtrl = TextEditingController(text: user?.phone ?? '');
    final branchCtrl = TextEditingController(text: user?.branch ?? '');
    final deptCtrl = TextEditingController(text: user?.department ?? '');
    final shiftCtrl = TextEditingController(text: user?.scheduledShift ?? '');
    final tablesCtrl = TextEditingController(
      text: user?.assignedTables.isNotEmpty == true ? user!.assignedTables.join(', ') : 'All Floor Tables (Auto-Sync)',
    );

    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Row(
                      children: [
                        Icon(Icons.edit_note, color: AppColors.darkGreen, size: 26),
                        SizedBox(width: 8),
                        Text(
                          'Edit Profile Details',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline, size: 18, color: AppColors.darkGreen),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Personal contact details (Name & Phone) can be updated by you. All duty info (Branch, Department, Shift, & Tables) are read-only and assigned by your Manager.',
                              style: TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.3),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Full Name Input
                    const Text('Full Name', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameCtrl,
                      decoration: InputDecoration(
                        hintText: 'Enter full name',
                        prefixIcon: const Icon(Icons.person_outline, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Phone Contact Input
                    const Text('Contact Number', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      decoration: InputDecoration(
                        hintText: 'Enter mobile number',
                        prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Branch (Assigned by Manager)
                    const Text('Branch / Restaurant Location ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: branchCtrl,
                      enabled: false,
                      style: const TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        prefixIcon: const Icon(Icons.storefront_outlined, size: 20, color: Color(0xFF94A3B8)),
                        suffixIcon: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF94A3B8)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Department (Assigned by Manager)
                    const Text('Department ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: deptCtrl,
                      enabled: false,
                      style: const TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        prefixIcon: const Icon(Icons.corporate_fare_outlined, size: 20, color: Color(0xFF94A3B8)),
                        suffixIcon: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF94A3B8)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Scheduled Shift (Assigned by Manager)
                    const Text('Scheduled Shift ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: shiftCtrl,
                      enabled: false,
                      style: const TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        prefixIcon: const Icon(Icons.schedule_outlined, size: 20, color: Color(0xFF94A3B8)),
                        suffixIcon: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF94A3B8)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Floor Section (Assigned by Manager)
                    const Text('Assigned Floor Section ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: tablesCtrl,
                      enabled: false,
                      style: const TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        prefixIcon: const Icon(Icons.table_restaurant_outlined, size: 20, color: Color(0xFF94A3B8)),
                        suffixIcon: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF94A3B8)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: isSaving ? null : () => Navigator.pop(ctx),
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.darkGreen,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: isSaving
                                ? null
                                : () async {
                                    final phoneVal = phoneCtrl.text.trim();
                                    if (phoneVal.isNotEmpty && phoneVal.length != 10) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Contact number must be exactly 10 digits.'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                      return;
                                    }

                                    setModalState(() => isSaving = true);
                                    final success = await authProvider.updateProfile({
                                      'name': nameCtrl.text.trim(),
                                      'phone': phoneVal,
                                    });
                                    setModalState(() => isSaving = false);

                                    if (ctx.mounted) {
                                      Navigator.pop(ctx);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            success
                                                ? 'Profile updated! Changes synced to MongoDB.'
                                                : (authProvider.errorMessage ?? 'Error updating profile'),
                                          ),
                                          backgroundColor: success ? AppColors.darkGreen : Colors.red,
                                        ),
                                      );
                                    }
                                  },
                            child: isSaving
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _pickAndUploadPhoto(BuildContext context, AuthProvider authProvider) async {
    try {
      final base64Image = await DeviceImagePicker.pickImage();
      if (base64Image != null && base64Image.isNotEmpty) {
        if (!context.mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                ),
                SizedBox(width: 12),
                Text('Uploading profile photo...'),
              ],
            ),
            duration: Duration(seconds: 2),
            backgroundColor: AppColors.darkGreen,
          ),
        );

        final success = await authProvider.updateProfile({
          'avatarUrl': base64Image.trim(),
        });

        if (!context.mounted) return;
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? '✓ Profile photo updated successfully!'
                  : (authProvider.errorMessage ?? 'Error saving profile photo'),
            ),
            backgroundColor: success ? AppColors.darkGreen : Colors.red,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick photo: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

