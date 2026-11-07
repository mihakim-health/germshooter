import { DiseaseItem, InfectionRoute } from '../types/game';

export const ROUTE_CONFIG: Record<
  InfectionRoute,
  {
    name: string;
    icon: string;
    color: string;
    lightColor: string;
    glowColor: string;
    keyNumber: string;
    shortLabel: string;
    preventionSummary: string;
    bulletDesc: string;
  }
> = {
  digestive: {
    name: '소화기계',
    icon: '🍽️',
    color: '#10b981', // Emerald 500
    lightColor: '#6ee7b7', // Emerald 300
    glowColor: 'rgba(16, 185, 129, 0.6)',
    keyNumber: '1',
    shortLabel: '소화기 백신',
    preventionSummary: '손 씻기, 음식과 물은 깨끗하게!',
    bulletDesc: '비오-클렌저 캡슐탄',
  },
  respiratory: {
    name: '호흡기계',
    icon: '😷',
    color: '#06b6d4', // Cyan 500
    lightColor: '#67e8f9', // Cyan 300
    glowColor: 'rgba(6, 182, 212, 0.6)',
    keyNumber: '2',
    shortLabel: '호흡기 백신',
    preventionSummary: '마스크, 기침 예절, 2시간마다 10분 환기!',
    bulletDesc: '에어로-나노 청정파',
  },
  skin: {
    name: '피부',
    icon: '🖐️',
    color: '#f43f5e', // Rose/Pink 500
    lightColor: '#fda4af', // Rose 300
    glowColor: 'rgba(244, 63, 94, 0.6)',
    keyNumber: '3',
    shortLabel: '피부 백신',
    preventionSummary: '접촉 피하기, 개인 물건 따로 쓰기, 상처 소독!',
    bulletDesc: '더마-베리어 살균광선',
  },
};

// 사용자가 지정한 정식 문제 목록만 엄격히 사용
export const DISEASES_DATABASE: DiseaseItem[] = [
  // 1. 소화기계 (7개)
  {
    id: 'd-1',
    name: '노로바이러스',
    route: 'digestive',
    prevention: '손 씻기, 음식과 물은 깨끗하게 익혀 먹기',
  },
  {
    id: 'd-2',
    name: '세균성 이질',
    route: 'digestive',
    prevention: '손 씻기, 음식과 물은 깨끗하게',
  },
  {
    id: 'd-3',
    name: '장티푸스',
    route: 'digestive',
    prevention: '손 씻기, 음식과 물은 깨끗하게',
  },
  {
    id: 'd-4',
    name: '콜레라',
    route: 'digestive',
    prevention: '손 씻기, 음식과 물은 깨끗하게',
  },
  {
    id: 'd-5',
    name: 'A형 간염',
    route: 'digestive',
    prevention: '손 씻기, 음식과 물은 깨끗하게',
  },
  {
    id: 'd-6',
    name: '오염된 물을 마셨어요',
    route: 'digestive',
    prevention: '손 씻기, 음식과 물은 깨끗하게',
    isSituation: true,
  },
  {
    id: 'd-7',
    name: '손을 씻지 않고 간식을 먹었어요',
    route: 'digestive',
    prevention: '손 씻기, 음식과 물은 깨끗하게',
    isSituation: true,
  },

  // 2. 호흡기계 (6개)
  {
    id: 'r-1',
    name: '인플루엔자',
    route: 'respiratory',
    prevention: '마스크, 기침 예절, 2시간마다 10분 환기',
  },
  {
    id: 'r-2',
    name: '결핵',
    route: 'respiratory',
    prevention: '마스크, 기침 예절, 2시간마다 10분 환기',
  },
  {
    id: 'r-3',
    name: '홍역',
    route: 'respiratory',
    prevention: '마스크, 기침 예절, 2시간마다 10분 환기',
  },
  {
    id: 'r-4',
    name: '유행성 이하선염',
    route: 'respiratory',
    prevention: '마스크, 기침 예절, 2시간마다 10분 환기',
  },
  {
    id: 'r-5',
    name: '마스크 없이 재채기한 친구',
    route: 'respiratory',
    prevention: '마스크, 기침 예절, 2시간마다 10분 환기',
    isSituation: true,
  },
  {
    id: 'r-6',
    name: '환기 안 된 교실에서 기침하는 친구',
    route: 'respiratory',
    prevention: '마스크, 기침 예절, 2시간마다 10분 환기',
    isSituation: true,
  },

  // 3. 피부 (5개)
  {
    id: 's-1',
    name: '농가진',
    route: 'skin',
    prevention: '접촉 피하기, 개인 물건 따로 쓰기, 상처 소독',
  },
  {
    id: 's-2',
    name: '사마귀',
    route: 'skin',
    prevention: '접촉 피하기, 개인 물건 따로 쓰기, 상처 소독',
  },
  {
    id: 's-3',
    name: '무좀',
    route: 'skin',
    prevention: '접촉 피하기, 개인 물건 따로 쓰기, 상처 소독',
  },
  {
    id: 's-4',
    name: '친구 물집의 진물을 만졌어요',
    route: 'skin',
    prevention: '접촉 피하기, 개인 물건 따로 쓰기, 상처 소독',
    isSituation: true,
  },
  {
    id: 's-5',
    name: '무좀 있는 사람과 수건을 같이 썼어요',
    route: 'skin',
    prevention: '접촉 피하기, 개인 물건 따로 쓰기, 상처 소독',
    isSituation: true,
  },
];
