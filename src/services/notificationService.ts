import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sendEmail } from './emailService'; // You'll need to implement this

interface ExpiringItem {
  id: string;
  type: 'site' | 'hosting' | 'app';
  name: string;
  expiryDate: string;
  userId: string;
  clientId: string;
}

export const checkExpirations = async () => {
  const now = new Date();
  const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const twoWeeksFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
  const threeDaysFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);

  const expiringItems: ExpiringItem[] = [];

  // Check sites
  const sitesQuery = query(collection(db, 'sites'), where('expirationDate', '<=', oneMonthFromNow.toISOString()));
  const sitesSnapshot = await getDocs(sitesQuery);
  sitesSnapshot.forEach(doc => {
    expiringItems.push({ id: doc.id, type: 'site', ...doc.data() } as ExpiringItem);
  });

  // Check hosting accounts
  const hostingQuery = query(collection(db, 'hostingAccounts'), where('expirationDate', '<=', oneMonthFromNow.toISOString()));
  const hostingSnapshot = await getDocs(hostingQuery);
  hostingSnapshot.forEach(doc => {
    expiringItems.push({ id: doc.id, type: 'hosting', ...doc.data() } as ExpiringItem);
  });

  // Check mobile apps
  const appsQuery = query(collection(db, 'mobileApps'), where('renewalDate', '<=', oneMonthFromNow.toISOString()));
  const appsSnapshot = await getDocs(appsQuery);
  appsSnapshot.forEach(doc => {
    expiringItems.push({ id: doc.id, type: 'app', ...doc.data() } as ExpiringItem);
  });

  for (const item of expiringItems) {
    const expiryDate = new Date(item.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    let notificationType = '';
    if (daysUntilExpiry <= 0) notificationType = 'expiry_day';
    else if (daysUntilExpiry <= 3) notificationType = 'three_days';
    else if (daysUntilExpiry <= 14) notificationType = 'two_weeks';
    else if (daysUntilExpiry <= 30) notificationType = 'one_month';

    if (notificationType) {
      await createNotification(item, notificationType);
      await sendNotificationEmails(item, notificationType);
    }
  }
};

const createNotification = async (item: ExpiringItem, notificationType: string) => {
  const notification = {
    type: item.type,
    itemId: item.id,
    itemName: item.name,
    expiryDate: item.expiryDate,
    notificationDate: new Date().toISOString(),
    status: 'pending',
    userId: item.userId,
    notificationType,
  };

  await addDoc(collection(db, 'notifications'), notification);
};

const sendNotificationEmails = async (item: ExpiringItem, notificationType: string) => {
  // Fetch user and client emails
  const userDoc = await getDocs(query(collection(db, 'users'), where('userId', '==', item.userId)));
  const clientDoc = await getDocs(query(collection(db, 'clients'), where('id', '==', item.clientId)));

  const userEmail = userDoc.docs[0].data().email;
  const clientEmail = clientDoc.docs[0].data().email;

  const subject = `Expiration Notice: ${item.name}`;
  const message = getNotificationMessage(item, notificationType);

  // Send emails
  await sendEmail(userEmail, subject, message);
  await sendEmail(clientEmail, subject, message);
};

const getNotificationMessage = (item: ExpiringItem, notificationType: string): string => {
  const expiryDate = new Date(item.expiryDate).toLocaleDateString();
  let timeFrame;

  switch (notificationType) {
    case 'one_month':
      timeFrame = 'one month';
      break;
    case 'two_weeks':
      timeFrame = 'two weeks';
      break;
    case 'three_days':
      timeFrame = 'three days';
      break;
    case 'expiry_day':
      timeFrame = 'today';
      break;
    default:
      timeFrame = 'soon';
  }

  return `
    Your ${item.type} "${item.name}" is expiring ${timeFrame} on ${expiryDate}.
    Please take necessary action to renew or update it.
    If you have any questions, please contact support.
  `;
};