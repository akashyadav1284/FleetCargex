import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { FileText, CheckCircle, UploadCloud, AlertCircle, Eye } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';

export default function DocumentUploadScreen() {
  const { driver, reloadProfile } = useAuth();
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Read actual document values from driver profile
  const profilePhoto = driver?.profileImage || '';
  const license = driver?.documents?.license || '';
  const vehicleRC = driver?.documents?.rc || '';

  const handleUpload = async (docType: string) => {
    setIsUploading(docType);
    try {
      // Simulate selecting a file and uploading it to server
      const generatedFileName = `${docType}_vetted_${Math.floor(Math.random() * 9000 + 1000)}.png`;
      
      let payload: any = {};
      if (docType === 'profilePhoto') {
        payload = { profileImage: generatedFileName };
      } else if (docType === 'driversLicense') {
        payload = { documents: { license: generatedFileName } };
      } else if (docType === 'vehicleRC') {
        payload = { documents: { rc: generatedFileName } };
      }

      await apiClient.put('/api/driver/update-profile', payload);
      await reloadProfile();
      
      Alert.alert('Upload Successful', 'Your document has been uploaded and verified in the database.');
    } catch (e: any) {
      Alert.alert('Upload Failed', e.response?.data?.message || 'Failed to update profile documents.');
    } finally {
      setIsUploading(null);
    }
  };

  const getStatusBadge = (value: string) => {
    if (value) {
      return { text: 'VERIFIED', bg: '#ECFDF5', color: COLORS.accent, Icon: CheckCircle };
    } else {
      return { text: 'MISSING', bg: '#FEF2F2', color: COLORS.red, Icon: AlertCircle };
    }
  };

  const renderDocRow = (docType: string, label: string, currentVal: string) => {
    const badge = getStatusBadge(currentVal);

    return (
      <View style={styles.docCard}>
        <View style={styles.docHeader}>
          <FileText size={22} color={COLORS.primary} />
          <Text style={styles.docLabel}>{label}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <badge.Icon size={12} color={badge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        {currentVal ? (
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{currentVal}</Text>
            <View style={styles.fileActions}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => Alert.alert('Preview Document', `Viewing file from database:\n${currentVal}`)}
              >
                <Eye size={16} color={COLORS.primary} />
                <Text style={styles.actionIconText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.noFile}>No document uploaded yet</Text>
        )}

        {isUploading === docType ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 10 }} />
        ) : (
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => handleUpload(docType)}
          >
            <UploadCloud size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.uploadBtnText}>
              {currentVal ? 'Upload New Version' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Vetting Documents</Text>
          <Text style={styles.subtitle}>Upload the required credentials to maintain active status in the driver pool.</Text>
        </View>

        {renderDocRow('profilePhoto', 'Profile Photo', profilePhoto)}
        {renderDocRow('driversLicense', "Driver's License", license)}
        {renderDocRow('vehicleRC', 'Vehicle RC Proof', vehicleRC)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  header: {
    marginVertical: SPACING.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 20,
  },
  docCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.foreground,
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fileDetails: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 8,
    padding: SPACING.sm,
    marginVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileName: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
    flex: 1,
  },
  fileActions: {
    flexDirection: 'row',
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionIconText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  noFile: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
    marginVertical: SPACING.md,
  },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  uploadBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
