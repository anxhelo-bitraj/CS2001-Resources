import EmailList from '../components/email/EmailList';
import EmailDetail from '../components/email/EmailDetail';

export default function InboxPage() {
  return (
    <div className="flex h-full">
      <EmailList folder="inbox" />
      <EmailDetail />
    </div>
  );
}
