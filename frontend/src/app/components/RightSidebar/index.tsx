const RightSidebar = () => {
    return (
        <aside className='hidden lg:block md:w-80 bg-white border-l border-gray-200 sticky top-14 h-[calc(100vh-4rem)] overflow-y-auto'>
            <section className='p-4'>
                <div className='flex items-center mb-4'>
                    <span className='text-lg font-bold text-slate-700'>ALS3 정보</span>
                </div>
                <div className='space-y-4 text-sm text-gray-600'>
                    <div>
                        <h3 className='font-semibold mb-2'>스토리지 서비스</h3>
                        <p>AWS S3 기반의 안전한 클라우드 파일 스토리지</p>
                    </div>
                    <div>
                        <h3 className='font-semibold mb-2'>주요 기능</h3>
                        <ul className='list-disc list-inside space-y-1'>
                            <li>파일 업로드/다운로드</li>
                            <li>폴더 관리</li>
                            <li>안전한 인증</li>
                        </ul>
                    </div>
                </div>
            </section>
        </aside>
    )
}

export { RightSidebar }
