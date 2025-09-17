@@ .. @@
-import { TopMenu } from '@/components/TopMenu';
-import { FooterSlim } from '@/components/FooterSlim';
+import { TopMenu } from '@/components/TopMenu';
+import { FooterSlim } from '@/components/FooterSlim';
+import { Link } from 'react-router-dom';

 export default function TermsPage() {
   return (
   )
 }
@@ .. @@
           <section className="mb-8">
             <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contact</h2>
             <p className="text-foreground">
-              For any questions or support, contact us at: <a href="mailto:hello@claimease.co.uk" className="text-primary hover:text-primary/80 transition-colors">hello@claimease.co.uk</a>
+              For any questions or support, contact us at: <Link to="mailto:hello@claimease.co.uk" className="text-primary hover:text-primary/80 transition-colors">hello@claimease.co.uk</Link>
             </p>
           </section>
         </div>