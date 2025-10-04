import React, { useState } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import API from '@/config/index';



export default function RegistrationScreen() {
  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      surname: '',
      firstname: '',
      othernames: '',
      email: '',
      password: '',
      password_confirmation: '',
      dob: '',
      phonenumber: '',
      whatsapp: '',
      registration_status: 'customer',
      referral_id: '',
      role: '',
    }
  });

  const [loading, setLoading] = useState(false);
  const regStatus = watch('registration_status');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data };
      // ensure dob is ISO date string
      if (payload.dob instanceof Date) {
        payload.dob = payload.dob.toISOString().split('T')[0];
      }
      const res = await API.post(`/register`, payload);
      const token = res.data.token;
      await SecureStore.setItemAsync('api_token', token);
      alert('Registered! token saved to secure store.');
    } catch (err) {
      const msg = err?.response?.data ?? err.message;
      alert('Registration failed: ' + JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Surname</Text>
      <Controller control={control} rules={{ required: true }} render={({ field: { onChange, value } }) => (
        <TextInput value={value} onChangeText={onChange} style={{borderWidth:1,marginBottom:8,padding:8}} />
      )} name="surname" />
      {errors.surname && <Text style={{color:'red'}}>Required</Text>}

      <Text>Firstname</Text>
      <Controller control={control} rules={{ required: true }} render={({ field: { onChange, value } }) => (
        <TextInput value={value} onChangeText={onChange} style={{borderWidth:1,marginBottom:8,padding:8}} />
      )} name="firstname" />

      <Text>Othernames</Text>
      <Controller control={control} render={({ field: { onChange, value } }) => (
        <TextInput value={value} onChangeText={onChange} style={{borderWidth:1,marginBottom:8,padding:8}} />
      )} name="othernames" />

      <Text>Email</Text>
      <Controller control={control} rules={{ required: true }} render={({ field: { onChange, value } }) => (
        <TextInput value={value} onChangeText={onChange} keyboardType="email-address" style={{borderWidth:1,marginBottom:8,padding:8}} />
      )} name="email" />

      <Text>Password</Text>
      <Controller control={control} rules={{ required:true, minLength:8 }} render={({ field: { onChange, value } }) => (
        <TextInput value={value} secureTextEntry onChangeText={onChange} style={{borderWidth:1,marginBottom:8,padding:8}} />
      )} name="password" />
      {errors.password && <Text style={{color:'red'}}>Password min 8 chars</Text>}

      <Text>Confirm Password</Text>
      <Controller control={control} rules={{ required:true }} render={({ field: { onChange, value } }) => (
        <TextInput value={value} secureTextEntry onChangeText={onChange} style={{borderWidth:1,marginBottom:8,padding:8}} />
      )} name="password_confirmation" />

      <Text>Date of Birth</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{borderWidth:1,padding:8,marginBottom:8}}>
        <Controller control={control} name="dob" render={({ field: { value, onChange } }) => (
          <Text>{ value ? (value instanceof Date ? value.toISOString().split('T')[0] : value) : 'Select date'}</Text>
        )} />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              // set controller value
              control.setValue('dob', date);
            }
          }}
        />
      )}

      <Text>Phone number</Text>
      <Controller control={control} render={({ field: { onChange, value } }) => (
        <TextInput value={value} onChangeText={onChange} style={{borderWidth:1,marginBottom:8,padding:8}} />
      )} name="phonenumber" />

      <Text>WhatsApp</Text>
      <Controller control={control} render={({ field: { onChange, value } }) => (
        <TextInput value={value} onChangeText={onChange} style={{borderWidth:1,marginBottom:8,padding:8}} />
      )} name="whatsapp" />

      <Text>Registration Status</Text>
      <Controller control={control} name="registration_status" render={({ field: { onChange, value } }) => (
        <View style={{flexDirection:'row',marginBottom:8}}>
          {['customer','agent','staff'].map((s) => (
            <TouchableOpacity key={s} onPress={() => onChange(s)} style={{marginRight:8}}>
              <Text style={{padding:8, borderWidth:1, backgroundColor: value === s ? '#ddd' : '#fff'}}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )} />

      {/* show referral only for agent */}
      {regStatus === 'agent' && (
        <>
          <Text>Referral ID (required for agents)</Text>
          <Controller control={control} rules={{ required: regStatus === 'agent' }} render={({ field: { onChange, value } }) => (
            <TextInput value={value} onChangeText={onChange} style={{borderWidth:1,marginBottom:8,padding:8}} />
          )} name="referral_id" />
        </>
      )}

      {/* show role only for staff */}
      {regStatus === 'staff' && (
        <>
          <Text>Role (admin or staff)</Text>
          <Controller control={control} name="role" render={({ field: { onChange, value } }) => (
            <View style={{flexDirection:'row',marginBottom:8}}>
              {['staff','admin'].map(r => (
                <TouchableOpacity key={r} onPress={() => onChange(r)} style={{marginRight:8}}>
                  <Text style={{padding:8,borderWidth:1, backgroundColor: value === r ? '#ddd' : '#fff'}}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )} />
        </>
      )}

      <Button title={loading ? 'Registering...' : 'Register'} onPress={handleSubmit(onSubmit)} disabled={loading} />
    </View>
  );
}
