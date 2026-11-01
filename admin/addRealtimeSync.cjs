const fs = require('fs');
const file = 'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/products/BulkProductEntryModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    fetchHierarchy();
    return () => { cancelled = true; };
  }, []);`;

const replacement = `    fetchHierarchy();

    // Real-time synchronization when Admin updates Categories, Subcategories, or Select Categories in Categories Manager
    let channel;
    try {
      channel = supabase
        .channel('salbeau-bulk-hierarchy-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'brands',
          filter: 'id=eq.salbeau_category_subcategory_hierarchy'
        }, () => {
          fetchHierarchy();
        })
        .subscribe();
    } catch (_) {}

    const handleWindowFocus = () => {
      fetchHierarchy();
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleWindowFocus);
      if (channel) {
        try { supabase.removeChannel(channel); } catch (_) {}
      }
    };
  }, [categories]);`;

let normContent = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  normContent = normContent.replace(normTarget, replacement);
  fs.writeFileSync(file, normContent, 'utf8');
  console.log('Successfully added realtime synchronization to BulkProductEntryModal.jsx');
} else {
  console.error('Target not found in BulkProductEntryModal.jsx');
}

