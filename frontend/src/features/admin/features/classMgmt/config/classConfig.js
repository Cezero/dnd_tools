import ClassList from '@/features/admin/features/classMgmt/components/classList';
import ClassDetail from '@/features/admin/features/classMgmt/components/classDetail';
import ClassEdit from '@/features/admin/features/classMgmt/components/classEdit';

export const routes = [
    { path: 'classes', component: ClassList, exact: true },
    { path: 'classes/:id', component: ClassDetail, exact: true },
    { path: 'classes/:id/edit', component: ClassEdit, exact: true },
];