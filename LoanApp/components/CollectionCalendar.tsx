import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarProps {
  collectionHistory: Array<{
    date: string;
    collections: Array<{
      id: number;
      loan_id: number;
      amount: number;
      payment_method: 'cash' | 'upi';
      shop_name?: string;
      owner_name?: string;
      collection_date: string;
    }>;
    total_amount: number;
  }>;
  onDateSelect: (date: string) => void;
  selectedDate?: string;
}

export const CollectionCalendar: React.FC<CalendarProps> = ({
  collectionHistory,
  onDateSelect,
  selectedDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Create a map of dates with collections for quick lookup
  const collectionDates = new Map();
  collectionHistory.forEach(day => {
    collectionDates.set(day.date, day);
  });

  // Get calendar data for current month
  const getCalendarData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the previous month if needed to fill the first week
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End at the next month if needed to fill the last week
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const hasCollections = collectionDates.has(dateStr);
      const collectionData = collectionDates.get(dateStr);
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        isCurrentMonth,
        isToday,
        hasCollections,
        collectionData,
        day: currentDate.getDate()
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDatePress = (dateStr: string, hasCollections: boolean) => {
    if (hasCollections) {
      onDateSelect(dateStr);
      setShowCalendar(false);
    } else {
      Alert.alert('No Collections', 'No collections found for this date');
    }
  };

  const formatMonth = () => {
    return currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = getCalendarData();

  return (
    <View style={styles.container}>
      {/* Calendar Toggle Button */}
      <TouchableOpacity 
        style={styles.calendarButton}
        onPress={() => setShowCalendar(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#6366f1" />
        <Text style={styles.calendarButtonText}>View Calendar</Text>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCalendar(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Collection Calendar</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.calendarContent}>
            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                <Ionicons name="chevron-back" size={24} color="#6366f1" />
              </TouchableOpacity>
              <Text style={styles.monthText}>{formatMonth()}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <Ionicons name="chevron-forward" size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>

            {/* Week Days Header */}
            <View style={styles.weekHeader}>
              {weekDays.map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((dayData, index) => {
                const { dateStr, isCurrentMonth, isToday, hasCollections, collectionData, day } = dayData;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      !isCurrentMonth && styles.otherMonthDay,
                      isToday && styles.todayCell,
                      hasCollections && styles.collectionDay,
                      selectedDate === dateStr && styles.selectedDay
                    ]}
                    onPress={() => handleDatePress(dateStr, hasCollections)}
                    disabled={!isCurrentMonth}
                  >
                    <Text style={[
                      styles.dayText,
                      !isCurrentMonth && styles.otherMonthText,
                      isToday && styles.todayText,
                      hasCollections && styles.collectionDayText,
                      selectedDate === dateStr && styles.selectedDayText
                    ]}>
                      {day}
                    </Text>
                    
                    {hasCollections && (
                      <View style={styles.collectionIndicator}>
                        <Text style={styles.collectionCount}>
                          {collectionData.collections.length}
                        </Text>
                      </View>
                    )}
                    
                    {hasCollections && (
                      <Text style={styles.collectionAmount}>
                        ₹{collectionData.total_amount}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Legend:</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.legendText}>Today</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
                  <Text style={styles.legendText}>Has Collections</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#6366f1' }]} />
                  <Text style={styles.legendText}>Selected</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  calendarContent: {
    flex: 1,
    padding: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 7 days per week
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  otherMonthDay: {
    backgroundColor: '#f9fafb',
  },
  todayCell: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  collectionDay: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  selectedDay: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  otherMonthText: {
    color: '#d1d5db',
  },
  todayText: {
    color: '#059669',
    fontWeight: '700',
  },
  collectionDayText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#4338ca',
    fontWeight: '700',
  },
  collectionIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  collectionAmount: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
    fontWeight: '600',
    color: '#3b82f6',
  },
  legend: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});