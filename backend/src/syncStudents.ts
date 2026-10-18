import { db } from './db';

const students = [
  {
    student_id: 'STU001',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@school.edu',
    phone: '+91 98765 43210',
    class: '10-A',
    department: 'Computer Science',
    roll_number: '01',
    rfid_uid: '8A:B9:D6:05',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
  },
  {
    student_id: 'STU002',
    name: 'Ananya Nair',
    email: 'ananya.nair@school.edu',
    phone: '+91 98765 43211',
    class: '10-A',
    department: 'Computer Science',
    roll_number: '02',
    rfid_uid: '0D:26:AA:04',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80'
  },
  {
    student_id: 'STU003',
    name: 'Arjun Menon',
    email: 'arjun.menon@school.edu',
    phone: '+91 98765 43212',
    class: '10-B',
    department: 'Electronics',
    roll_number: '03',
    rfid_uid: '12:34:56:78',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
  },
  {
    student_id: 'STU004',
    name: 'Meera Joseph',
    email: 'meera.joseph@school.edu',
    phone: '+91 98765 43213',
    class: '10-B',
    department: 'Computer Science',
    roll_number: '04',
    rfid_uid: 'AB:CD:EF:12',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  }
];

const upsert = db.prepare(`
  INSERT INTO students (student_id, name, email, phone, class, department, roll_number, rfid_uid, photo_url)
  VALUES (@student_id, @name, @email, @phone, @class, @department, @roll_number, @rfid_uid, @photo_url)
  ON CONFLICT(student_id) DO UPDATE SET
    name = excluded.name,
    email = excluded.email,
    class = excluded.class,
    department = excluded.department,
    roll_number = excluded.roll_number,
    rfid_uid = excluded.rfid_uid,
    photo_url = excluded.photo_url
`);

for (const s of students) {
  upsert.run(s);
}

console.log('User students synced to database successfully!');
