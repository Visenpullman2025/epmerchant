import { PageLoading } from '@/components/PageLoading';

// Next App Router 路由切换 boundary，避免多个组件 InlineLoading 同时叠加
export default function RouteLoading() {
  return <PageLoading />;
}
