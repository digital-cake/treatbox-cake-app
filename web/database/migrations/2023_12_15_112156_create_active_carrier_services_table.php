<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateActiveCarrierServicesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('active_carrier_services', function (Blueprint $table) {
            $table->id();
            $table->string('shop', 255);
            $table->string('carrier_service_id', 255);
            $table->string('name', 255);
            $table->string('callback_url', 255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('active_carrier_services');
    }
}
