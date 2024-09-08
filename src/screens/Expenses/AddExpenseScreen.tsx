import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import Input from '@components/Input';
import Button from '@components/Button';
import MyDatePicker from '@components/MyDatePicker';
import { generateUUID, categories as availableCategoriesList, paymentMethods as availablePaymentMethodsList } from '@utils/common';
import { useDispatch } from 'react-redux';
import { addExpense } from '@store/expenseSlice';
import { showToast } from '@store/toastSlice';
import { SettingsService } from '@services/settingsService';
import { ExpenseService } from '@services/expenseService';
import { useFocusEffect } from '@react-navigation/native';
import MultiSelect from '@components/MultiSelect';
import { Snackbar } from 'react-native-paper';

const AddExpenseScreen: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<string[]>([]);
  const [group, setGroup] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<{ id: string; name: string }[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string }[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<{ id: string; name: string }[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isSnackbarVisible, setIsSnackbarVisible] = useState<boolean>(false);
  const [snackbarSuccess, setSnackbarSuccess] = useState<boolean>(true);
  const dispatch = useDispatch();

  // Load available groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await ExpenseService.getGroups();
        const groupList = groups.map(group => ({ id: group.id, name: group.name }));
        setAvailableGroups(groupList);

        if (groupList.length > 0) {
          setGroup([groupList[0].id]);
        }
      } catch (error) {
        dispatch(showToast({ message: 'Failed to load groups', type: 'error' }));
      }
    };

    loadGroups();
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          const visibleCategories = await SettingsService.getVisibleCategories();
          const categoriesList = availableCategoriesList
            .filter(category => visibleCategories[category.id])
            .map(category => ({ id: category.id, name: category.name }));

          setAvailableCategories(categoriesList);

          const visiblePaymentMethods = await SettingsService.getVisiblePaymentMethods();
          const paymentMethodsList = availablePaymentMethodsList
            .filter(method => visiblePaymentMethods[method.id])
            .map(method => ({ id: method.id, name: method.name }));

          setAvailablePaymentMethods(paymentMethodsList);
        } catch (error) {
          dispatch(showToast({ message: 'Failed to load settings', type: 'error' }));
        }
      };

      loadSettings();
    }, [dispatch])
  );

  const handleAddExpense = () => {
    if (!amount || category.length === 0 || !description || paymentMethod.length === 0 || group.length === 0) {
      showFeedback('Please fill out all fields', false);
      return;
    }

    const id = generateUUID();

    const newExpense: Expense = {
      id: id,
      amount: parseFloat(amount),
      category: category[0],
      description,
      date: (selectedDate || new Date()).toISOString(),
      paymentMethod: paymentMethod[0],
      group: group[0],
    };

    try {
      dispatch(addExpense(newExpense));
      showFeedback('Expense added successfully', true);

      setAmount('');
      setCategory([]);
      setDescription('');
      setSelectedDate(undefined);
      setPaymentMethod([]);
      setGroup(availableGroups.length > 0 ? [availableGroups[0].id] : []);
    } catch (error) {
      showFeedback('Failed to add expense', false);
    }
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDateCancel = () => {
    console.log('Date selection canceled');
  };

  const showFeedback = (message: string, success: boolean) => {
    setFeedbackMessage(message);
    setSnackbarSuccess(success);
    setIsSnackbarVisible(true);
  };

  const handleSnackbarDismiss = () => {
    setIsSnackbarVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />
      <MultiSelect
        items={availableCategories}
        selectedItems={category}
        onSelectionChange={setCategory}
        title="Select a Category"
        placeholder="Choose Category"
        fieldLabel="Category"
        isSingleSelect={true}
      />
      <MultiSelect
        items={availablePaymentMethods}
        selectedItems={paymentMethod}
        onSelectionChange={setPaymentMethod}
        title="Select a Payment Method"
        placeholder="Choose Payment Method"
        fieldLabel="Payment Method"
        isSingleSelect={true}
      />
      <MultiSelect
        items={availableGroups}
        selectedItems={group}
        onSelectionChange={setGroup}
        title="Select a Group"
        placeholder="Choose Group"
        fieldLabel="Group"
        isSingleSelect={true}
      />
      <Input
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <MyDatePicker
        placeholder="Select Date"
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        style={styles.input}
      />
      <Button onPress={handleAddExpense}>
        Add Expense
      </Button>

      <Snackbar
        visible={isSnackbarVisible}
        onDismiss={handleSnackbarDismiss}
        duration={3000}
        style={{ backgroundColor: snackbarSuccess ? '#4CAF50' : '#F44336' }}
      >
        {feedbackMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  input: {
    marginVertical: 10,
  },
});

export default AddExpenseScreen;