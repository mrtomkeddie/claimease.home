@@ .. @@
-import { TopMenu } from '@/components/TopMenu';
-import { FooterSlim } from '@/components/FooterSlim';
+import { TopMenu } from '@/components/TopMenu';
+import { FooterSlim } from '@/components/FooterSlim';
+import { Link } from 'react-router-dom';

 export default function PrivacyPage() {
   return (
   )
 }
@@ .. @@
             <ul className="list-disc pl-6 space-y-2 text-foreground">
               <li>Withdraw consent at any time.</li>
-              <li>Contact us for any privacy-related request: <a href="mailto:hello@claimease.co.uk" className="text-primary hover:text-primary/80 transition-colors">hello@claimease.co.uk</a></li>
+              <li>Contact us for any privacy-related request: <Link to="mailto:hello@claimease.co.uk" className="text-primary hover:text-primary/80 transition-colors">hello@claimease.co.uk</Link></li>
             </ul>
           </section>