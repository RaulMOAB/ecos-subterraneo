<template>
  <div class="path-layer">
    <svg ref="svgEl" class="scene-path" xmlns="http://www.w3.org/2000/svg">
      <!-- TRONCO desde el final del intro hasta justo antes de la última escena -->
      <line
        class="scene-path-trunk"
        :x1="trunkX"
        :y1="trunkStart"
        :x2="trunkX"
        :y2="trunkEnd"
        stroke="#f5c05a"
        stroke-width="4"
        stroke-linecap="round"
      />

      <!-- BIFURCACIÓN RAMAS una por cada escena -->
      <path
        v-for="(branch, index) in branches"
        :key="index"
        class="scene-path-branch"
        :class="[
          'scene-path-branch',
          { 'scene-path-branch--active': index === visibleBranchIndex },
        ]"
        :d="branch.d"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- ABEJA  -->
      <g
        v-if="hasTrunk"
        class="scene-path-bee"
        :class="{ 'is-hovered': isBeeHovered }"
        :transform="`translate(${beeX} ${beeY}) rotate(${beeAngle})`"
        @mouseenter="onBeeEnter"
        @mouseleave="onBeeLeave"
        @click="onBeeClick"
      >
        <image
          :href="beeUrl"
          x="-21"
          y="-25"
          width="46"
          height="46"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { defineExpose } from 'vue'
import { usePathTrail } from './pathTrail.js'

const api = usePathTrail()

const {
  svgEl,
  trunkStart,
  trunkEnd,
  trunkX,
  branches,
  visibleBranchIndex,
  beeX,
  beeY,
  hasTrunk,
  beeUrl,
  beeAngle,
  isBeeHovered,
  onBeeEnter,
  onBeeLeave,
  onBeeClick,
  recalcGeometry,
  recalcOnScroll,
} = api

defineExpose({
  recalcGeometry,
  recalcOnScroll,
})
</script>

<style src="@/styles/pathTrail.css"></style>
