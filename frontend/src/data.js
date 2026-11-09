export const starterEntities = [
  { id: 'disease_diabetes', name: 'Diabetes', type: 'Disease', description: 'A condition involving elevated blood glucose.' },
  { id: 'symptom_thirst', name: 'Increased thirst', type: 'Symptom', description: 'A possible symptom that can have many causes.' },
  { id: 'symptom_urination', name: 'Frequent urination', type: 'Symptom', description: 'A possible symptom that can have many causes.' },
  { id: 'test_glucose', name: 'Blood glucose test', type: 'Treatment', description: 'A test used by clinicians to measure blood glucose.' },
  { id: 'medicine_demo', name: 'Example medicine record', type: 'Medicine', description: 'Fictional record for demonstrating graph connections.' },
  { id: 'patient_demo', name: 'Demo Patient 001', type: 'Patient', description: 'Fictional patient record. Not real medical data.' }
]
export const starterRelationships = [
  { id: 'rel_1', sourceId: 'disease_diabetes', targetId: 'symptom_thirst', label: 'MAY_HAVE_SYMPTOM' },
  { id: 'rel_2', sourceId: 'disease_diabetes', targetId: 'symptom_urination', label: 'MAY_HAVE_SYMPTOM' },
  { id: 'rel_3', sourceId: 'disease_diabetes', targetId: 'test_glucose', label: 'MAY_REQUIRE_TEST' },
  { id: 'rel_4', sourceId: 'disease_diabetes', targetId: 'medicine_demo', label: 'EXAMPLE_TREATMENT_LINK' },
  { id: 'rel_5', sourceId: 'patient_demo', targetId: 'disease_diabetes', label: 'DEMO_ASSOCIATION' }
]
