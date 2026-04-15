'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';

import { Input } from './Input';

type CountryItem = {
  code: string;
  label: string;
  dialCode: string;
};

const REGION_LABELS = new Intl.DisplayNames(['en'], { type: 'region' });

const COUNTRIES: CountryItem[] = getCountries()
  .map((code) => {
    try {
      const dialCode = getCountryCallingCode(code);
      const label = REGION_LABELS.of(code) || code;
      return { code, label, dialCode };
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .sort((a: any, b: any) => a.label.localeCompare(b.label));

function toDigits(value: string) {
  return (value || '').replace(/\D/g, '');
}

function formatE164(countryCode: string, national: string) {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return '';
  const digits = toDigits(national);
  return digits ? `+${country.dialCode}${digits}` : '';
}

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('OM');
  const [nationalNumber, setNationalNumber] = useState('');

  useEffect(() => {
    const raw = (value || '').trim();
    if (!raw) return;
    const parsed = parsePhoneNumberFromString(raw);
    if (!parsed?.country) return;
    setCountryCode(parsed.country);
    setNationalNumber(parsed.nationalNumber || '');
  }, [value]);

  useEffect(() => {
    onChange(formatE164(countryCode, nationalNumber));
  }, [countryCode, nationalNumber, onChange]);

  const dialPrefix = useMemo(() => {
    const selected = COUNTRIES.find((c) => c.code === countryCode);
    return selected ? `+${selected.dialCode}` : '+';
  }, [countryCode]);

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,240px),1fr]">
      <select
        className="focus:border-kaffza-primary w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
        value={countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
        disabled={disabled}
      >
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.label} ({country.code}) +{country.dialCode}
          </option>
        ))}
      </select>

      <div className="relative">
        <span className="text-kaffza-text/70 pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold">
          {dialPrefix}
        </span>
        <Input
          className="pl-14"
          value={nationalNumber}
          onChange={(e: any) => setNationalNumber(e.target.value)}
          placeholder="Phone number"
          inputMode="tel"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
