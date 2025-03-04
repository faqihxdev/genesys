"use client";

import { useState } from 'react';
import { PageTitle } from '@/components/custom/page-title';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const attributes = [
  'Openness to Experience',
  'Conscientiousness',
  'Extraversion',
  'Agreeableness',
  'Decision-Making Style',
  'Motivation',
  'Triggers',
  'Values',
  'Age Range',
  'Gender'
];

const levels = [
  { value: '1-3', label: 'Low (1-3)' },
  { value: '4-6', label: 'Medium (4-6)' },
  { value: '7-10', label: 'High (7-10)' },
];

const decisionStyles = [
  { value: 'rational', label: 'Rational' },
  { value: 'heuristic', label: 'Heuristic' },
  { value: 'emotional', label: 'Emotional' }
];

const ageRanges = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55+', label: '55+' },
];

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function PersonaPage() {
  const [persona, setPersona] = useState(
    Object.fromEntries(attributes.map(attr => [attr, '']))
  );
  const [results, setResults] = useState(null);
  const handleSelectChange = (attribute, value) => {
    setPersona(prev => ({ ...prev, [attribute]: value }));
  };

  const handleQueryDatabase = async () => {
    try {
      const response = await fetch('/api/queryPersona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error querying database:', error);
    }
  };

  return (
    <div className='space-y-4'>
      <PageTitle
        title='AI Personas'
        description='Create and manage AI-powered customer personas to simulate diverse user behaviors and preferences through your marketing funnels.'
      />
      <div className='grid grid-cols-2 gap-6'>
        {attributes.map((attr, index) => (
          <div key={attr} className='flex items-center space-x-4'>
            <span className='w-64 font-semibold'>{attr}</span>
            <Select onValueChange={(value) => handleSelectChange(attr, value)}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Select Level' />
              </SelectTrigger>
              <SelectContent>
                {attr === 'Age Range' ? (
                  ageRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                  ))
                ) : attr === 'Gender' ? (
                  genders.map(gender => (
                    <SelectItem key={gender.value} value={gender.value}>{gender.label}</SelectItem>
                  ))
                ) : attr === 'Decision-Making Style' ? (
                  decisionStyles.map(style => (
                    <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                  ))
                ) : (
                  levels.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <Button onClick={handleQueryDatabase} className='mt-6'>Query Database</Button>
      {results && (
        <div className='mt-6 p-4 border rounded bg-gray-100'>
          <h2 className='text-lg font-bold'>Matching Entries:</h2>
          <pre className='text-sm'>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

